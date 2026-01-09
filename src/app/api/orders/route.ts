import { NextResponse } from "next/server";
import { buildOrderItemsTotal, createOrder, getProducts } from "@/lib/store";
import type { OrderItem } from "@/lib/types";
import { getTelegramUser } from "@/lib/telegram";
import { validateOrderItems } from "@/lib/validation";
import { buildAdminOrderMessage, sendTelegramMessage } from "@/lib/telegramBot";
import { getAdminIds } from "@/lib/admin";

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const initData = request.headers.get("x-telegram-init-data");
  if (!botToken || !initData) {
    return NextResponse.json({ ok: false, error: "Требуется Telegram" }, { status: 401 });
  }
  const user = getTelegramUser(initData, botToken);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Неверные данные Telegram" }, { status: 401 });
  }

  const body = (await request.json()) as {
    customerName: string;
    customerPhone: string;
    deliveryMethod: "Курьер" | "Самовывоз";
    deliveryAddress?: string;
    deliveryPrice: number;
    customerComment?: string;
    items: OrderItem[];
  };

  const itemsError = validateOrderItems(body.items);
  if (itemsError) {
    return NextResponse.json({ ok: false, error: itemsError }, { status: 400 });
  }

  const products = getProducts();
  const normalizedItems = body.items.map((item) => {
    const product = products.find((prod) => prod.id === item.productId);
    const title = product?.title ?? item.title;
    return { ...item, title };
  });

  for (const item of normalizedItems) {
    const product = products.find((prod) => prod.id === item.productId);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Товар не найден" }, { status: 400 });
    }
    let availableStock = product.stock;
    if (product.variants?.length && item.variantSelections?.length) {
      const firstGroup = product.variants[0];
      const selected = item.variantSelections.find((sel) => sel.groupId === firstGroup.id);
      const option = firstGroup.options.find((opt) => opt.id === selected?.optionId);
      availableStock = option?.stock ?? 0;
    }
    if (item.quantity > availableStock) {
      return NextResponse.json(
        { ok: false, error: `Недостаточно товара: ${product.title}` },
        { status: 400 }
      );
    }
  }

  const totalItems = buildOrderItemsTotal(normalizedItems);
  const deliveryPrice = Number.isFinite(body.deliveryPrice) ? body.deliveryPrice : 0;
  const totalPrice = totalItems + deliveryPrice;

  const order = createOrder({
    status: "Создан",
    paymentStatus: "Не оплачено",
    items: normalizedItems,
    totalItems,
    deliveryMethod: body.deliveryMethod,
    deliveryAddress: body.deliveryAddress || null,
    deliveryPrice,
    totalPrice,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerComment: body.customerComment || null,
    telegramUserId: user.id
  });

  const admins = getAdminIds();
  const message = buildAdminOrderMessage(order);
  const keyboard = {
    inline_keyboard: [
      [
        { text: "Подтвердить", callback_data: `order:${order.id}:confirm` },
        { text: "Отменить", callback_data: `order:${order.id}:cancel` }
      ],
      [
        { text: "В доставке", callback_data: `order:${order.id}:delivery` },
        { text: "Готов к выдаче", callback_data: `order:${order.id}:ready` }
      ],
      [{ text: "Завершён", callback_data: `order:${order.id}:done` }]
    ]
  };
  await Promise.all(
    admins.map((adminId) =>
      sendTelegramMessage(adminId, message, { reply_markup: keyboard })
    )
  );

  return NextResponse.json(order);
}
