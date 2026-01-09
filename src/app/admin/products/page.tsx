"use client";

import { useEffect, useState } from "react";
import type { Product, VariantGroup } from "@/lib/types";

function getInitData() {
  // @ts-expect-error Telegram WebApp runtime
  return window?.Telegram?.WebApp?.initData || "";
}

const emptyProduct: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  category: "",
  brand: "",
  condition: "new",
  description: "",
  price: 0,
  oldPrice: null,
  stock: 0,
  active: true,
  images: [""],
  characteristics: [],
  variants: []
};

export default function AdminProducts() {
  const [authorized, setAuthorized] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyProduct);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const initData = getInitData();
      const access = await fetch("/api/admin/me", { headers: { "x-telegram-init-data": initData } });
      setAuthorized(access.ok);
      if (!access.ok) return;
      const res = await fetch("/api/admin/products", { headers: { "x-telegram-init-data": initData } });
      const data = (await res.json()) as Product[];
      setProducts(data);
    }
    load();
  }, []);

  async function submit() {
    setMessage(null);
    const initData = getInitData();
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData
      },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Ошибка сохранения");
      return;
    }
    setProducts((prev) => [...prev, data]);
    setForm(emptyProduct);
    setMessage("Товар добавлен");
  }

  async function updateProduct(product: Product) {
    const initData = getInitData();
    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData
      },
      body: JSON.stringify(product)
    });
    if (!response.ok) return;
    const data = (await response.json()) as Product;
    setProducts((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  }

  async function deleteProduct(id: string) {
    const initData = getInitData();
    await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
      headers: { "x-telegram-init-data": initData }
    });
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  if (!authorized) {
    return <div className="card">Нет доступа к админке.</div>;
  }

  return (
    <div className="space-y-6">
      <a className="text-sm text-slate-600" href="/admin">← Назад</a>
      <div className="card space-y-3">
        <h1 className="text-lg font-semibold">Добавить товар</h1>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input" placeholder="Название" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <input className="input" placeholder="Категория" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          <input className="input" placeholder="Бренд" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} />
          <select className="input" value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value as Product["condition"] })}>
            <option value="new">Новый</option>
            <option value="used">Б/у</option>
          </select>
          <input className="input" placeholder="Цена" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
          <input className="input" placeholder="Старая цена" value={form.oldPrice ?? ""} onChange={(event) => setForm({ ...form, oldPrice: Number(event.target.value) || null })} />
          <input className="input" placeholder="Остаток" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Активный
          </label>
        </div>
        <textarea className="input" rows={3} placeholder="Описание" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <input className="input" placeholder="Ссылка на фото" value={form.images[0]} onChange={(event) => setForm({ ...form, images: [event.target.value] })} />
        <button className="button-primary" onClick={submit}>Добавить</button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <ProductRow key={product.id} product={product} onChange={updateProduct} onDelete={deleteProduct} />
        ))}
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onChange,
  onDelete
}: {
  product: Product;
  onChange: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(product);

  useEffect(() => setLocal(product), [product]);

  function updateVariants(raw: string) {
    try {
      const parsed = JSON.parse(raw) as VariantGroup[];
      setLocal({ ...local, variants: parsed });
    } catch {
      // ignore
    }
  }

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <strong>{product.title}</strong>
        <div className="flex gap-2">
          <button className="button-secondary" onClick={() => onChange(local)}>Сохранить</button>
          <button className="button-secondary" onClick={() => onDelete(product.id)}>Удалить</button>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="input" value={local.price} onChange={(event) => setLocal({ ...local, price: Number(event.target.value) })} />
        <input className="input" value={local.oldPrice ?? ""} onChange={(event) => setLocal({ ...local, oldPrice: Number(event.target.value) || null })} />
        <input className="input" value={local.stock} onChange={(event) => setLocal({ ...local, stock: Number(event.target.value) })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={local.active} onChange={(event) => setLocal({ ...local, active: event.target.checked })} />
        Активный
      </label>
      <textarea
        className="input"
        rows={3}
        value={JSON.stringify(local.variants || [], null, 2)}
        onChange={(event) => updateVariants(event.target.value)}
      />
      <p className="text-xs text-slate-500">Варианты редактируются JSON-структурой (группы/опции).</p>
    </div>
  );
}
