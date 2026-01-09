"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderItem, Product, VariantGroup } from "@/lib/types";

const CART_KEY = "store137_cart";

type CartItem = OrderItem & {
  maxStock: number;
};

function getInitData() {
  if (typeof window === "undefined") return "";
  // @ts-expect-error Telegram WebApp runtime
  const initData = window?.Telegram?.WebApp?.initData || "";
  return initData;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function buildVariantLabel(selections: CartItem["variantSelections"]) {
  if (!selections?.length) return "";
  return selections.map((item) => `${item.groupName}: ${item.optionTitle}`).join(", ");
}

function resolveVariant(groups: VariantGroup[] | undefined, selection: Record<string, string>) {
  if (!groups?.length) return { price: 0, stock: 0, selections: [] as CartItem["variantSelections"] };
  const selections = groups.map((group) => {
    const option = group.options.find((opt) => opt.id === selection[group.id]) ?? group.options[0];
    return {
      groupId: group.id,
      groupName: group.name,
      optionId: option.id,
      optionTitle: option.title
    };
  });

  const option = groups[0]?.options.find((opt) => opt.id === selection[groups[0].id]);
  return {
    price: option?.price ?? 0,
    stock: option?.stock ?? 0,
    selections
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [memory, setMemory] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [orderForm, setOrderForm] = useState({
    name: "",
    phone: "",
    method: "Курьер",
    address: "",
    comment: "",
    deliveryPrice: "0"
  });
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      try {
        setCart(JSON.parse(stored) as CartItem[]);
      } catch {
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = (await res.json()) as Product[];
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))), [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (search && !product.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (brand && product.brand !== brand) return false;
      if (condition && product.condition !== condition) return false;
      if (onlyAvailable && product.stock <= 0) return false;
      if (priceFrom && product.price < Number(priceFrom)) return false;
      if (priceTo && product.price > Number(priceTo)) return false;
      if (memory) {
        const memoryValue = product.characteristics.find((item) =>
          item.label.toLowerCase().includes("память")
        );
        if (!memoryValue || !memoryValue.value.includes(memory)) return false;
      }
      return true;
    });
  }, [products, search, brand, condition, onlyAvailable, priceFrom, priceTo, memory]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryPrice = Number(orderForm.deliveryPrice || 0);
  const totalWithDelivery = cartTotal + deliveryPrice;

  function addToCart(product: Product, selection: Record<string, string>) {
    const variantData = resolveVariant(product.variants, selection);
    const price = product.variants?.length ? variantData.price || product.price : product.price;
    const stock = product.variants?.length ? variantData.stock : product.stock;
    const existing = cart.find((item) => item.productId === product.id && buildVariantLabel(item.variantSelections) === buildVariantLabel(variantData.selections));
    if (existing) {
      if (existing.quantity + 1 > existing.maxStock) return;
      setCart((prev) =>
        prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
      return;
    }
    const item: CartItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      title: product.title,
      price,
      quantity: 1,
      maxStock: stock,
      variantSelections: variantData.selections
    };
    setCart((prev) => [...prev, item]);
  }

  function updateQuantity(itemId: string, next: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.min(item.maxStock, Math.max(1, next)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function submitOrder() {
    setError(null);
    setOrderStatus(null);
    if (!cart.length) {
      setError("Корзина пуста");
      return;
    }
    if (!orderForm.name || !orderForm.phone) {
      setError("Введите имя и телефон");
      return;
    }
    if (orderForm.method === "Курьер" && !orderForm.address) {
      setError("Введите адрес доставки");
      return;
    }

    const initData = getInitData();
    if (!initData) {
      setError("Оформление доступно только в Telegram");
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData
      },
      body: JSON.stringify({
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        deliveryMethod: orderForm.method,
        deliveryAddress: orderForm.method === "Курьер" ? orderForm.address : "",
        deliveryPrice,
        customerComment: orderForm.comment,
        items: cart.map(({ maxStock, ...item }) => item)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Не удалось создать заявку");
      return;
    }
    setCart([]);
    setOrderStatus("Заявка создана, менеджер подтвердит");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">Store 137</p>
          <h1 className="text-2xl font-semibold">Магазин смартфонов и гаджетов</h1>
          <p className="text-sm text-slate-600">Москва · Оплата наличными при получении</p>
        </div>
        <a className="button-secondary" href="/admin">Админка</a>
      </header>

      <section className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Поиск</label>
            <input
              className="input"
              placeholder="iPhone, Samsung..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label className="label">Бренд</label>
            <select className="input" value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="">Все бренды</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Состояние</label>
            <select
              className="input"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
            >
              <option value="">Любое</option>
              <option value="new">Новый</option>
              <option value="used">Б/у</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label">Цена от</label>
            <input className="input" value={priceFrom} onChange={(event) => setPriceFrom(event.target.value)} />
          </div>
          <div>
            <label className="label">Цена до</label>
            <input className="input" value={priceTo} onChange={(event) => setPriceTo(event.target.value)} />
          </div>
          <div>
            <label className="label">Память</label>
            <input className="input" placeholder="128 ГБ" value={memory} onChange={(event) => setMemory(event.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(event) => setOnlyAvailable(event.target.checked)}
              />
              Только в наличии
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          {loading ? (
            <div className="card">Загрузка каталога...</div>
          ) : filtered.length === 0 ? (
            <div className="card">Нет товаров по выбранным фильтрам.</div>
          ) : (
            filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold">Корзина</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500">Добавьте товары, чтобы оформить заявку.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="space-y-1 border-b border-slate-100 pb-3">
                    <div className="text-sm font-semibold">{item.title}</div>
                    {item.variantSelections?.length ? (
                      <div className="text-xs text-slate-500">{buildVariantLabel(item.variantSelections)}</div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <button className="button-secondary" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button className="button-secondary" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                      <span className="ml-auto text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)} ₽
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Товары</span>
                  <span>{formatPrice(cartTotal)} ₽</span>
                </div>
              </div>
            )}
          </div>

          <div className="card space-y-3">
            <h2 className="text-lg font-semibold">Оформление заявки</h2>
            <div>
              <label className="label">Имя</label>
              <input className="input" value={orderForm.name} onChange={(event) => setOrderForm({ ...orderForm, name: event.target.value })} />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input className="input" value={orderForm.phone} onChange={(event) => setOrderForm({ ...orderForm, phone: event.target.value })} />
            </div>
            <div>
              <label className="label">Способ получения</label>
              <select className="input" value={orderForm.method} onChange={(event) => setOrderForm({ ...orderForm, method: event.target.value })}>
                <option value="Курьер">Курьер</option>
                <option value="Самовывоз">Самовывоз</option>
              </select>
            </div>
            {orderForm.method === "Курьер" ? (
              <div>
                <label className="label">Адрес</label>
                <input className="input" value={orderForm.address} onChange={(event) => setOrderForm({ ...orderForm, address: event.target.value })} />
              </div>
            ) : null}
            <div>
              <label className="label">Стоимость доставки</label>
              <input className="input" value={orderForm.deliveryPrice} onChange={(event) => setOrderForm({ ...orderForm, deliveryPrice: event.target.value })} />
            </div>
            <div>
              <label className="label">Комментарий</label>
              <textarea className="input" rows={3} value={orderForm.comment} onChange={(event) => setOrderForm({ ...orderForm, comment: event.target.value })} />
            </div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Итого</span>
              <span>{formatPrice(totalWithDelivery)} ₽</span>
            </div>
            {error ? <p className="text-sm text-rose-500">{error}</p> : null}
            {orderStatus ? <p className="text-sm text-emerald-600">{orderStatus}</p> : null}
            <button className="button-primary" onClick={submitOrder}>
              Отправить заявку
            </button>
            <p className="text-xs text-slate-500">Оплата только наличными при получении.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product, selection: Record<string, string>) => void }) {
  const [selection, setSelection] = useState<Record<string, string>>({});
  const hasVariants = product.variants && product.variants.length > 0;
  const selectedStock = hasVariants
    ? product.variants?.[0]?.options.find((option) => option.id === selection[product.variants?.[0]?.id ?? \"\"])
        ?.stock ?? 0
    : product.stock;

  useEffect(() => {
    if (hasVariants) {
      const initial: Record<string, string> = {};
      product.variants?.forEach((group) => {
        if (group.options[0]) {
          initial[group.id] = group.options[0].id;
        }
      });
      setSelection(initial);
    }
  }, [hasVariants, product.variants]);

  return (
    <article className="card space-y-3">
      <div className="flex flex-col gap-4 md:flex-row">
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-40 w-full rounded-lg object-cover md:w-48"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <p className="text-xs text-slate-500">{product.brand} · {product.category}</p>
              <p className="text-xs text-slate-500">{product.condition === "new" ? "Новый" : "Б/у"}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{formatPrice(product.price)} ₽</div>
              {product.oldPrice ? (
                <div className="text-xs text-slate-400 line-through">{formatPrice(product.oldPrice)} ₽</div>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-slate-600">{product.description}</p>
          <div className="flex flex-wrap gap-2">
            {product.characteristics.map((item) => (
              <span key={item.label} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                {item.label}: {item.value}
              </span>
            ))}
          </div>
          {hasVariants ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {product.variants?.map((group) => (
                <div key={group.id}>
                  <label className="label">{group.name}</label>
                  <select
                    className="input"
                    value={selection[group.id]}
                    onChange={(event) => setSelection({ ...selection, [group.id]: event.target.value })}
                  >
                    {group.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title} · {formatPrice(option.price || product.price)} ₽ · {option.stock} шт.
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">В наличии: {selectedStock}</span>
            <button
              className="button-primary"
              onClick={() => onAdd(product, selection)}
              disabled={selectedStock <= 0}
            >
              Добавить
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
