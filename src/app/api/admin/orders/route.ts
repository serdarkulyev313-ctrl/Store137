import { NextResponse } from "next/server";
import { getOrders, replaceOrder, updateOrderStatus } from "@/lib/store";
import { getTelegramUser } from "@/lib/telegram";
import { isAdmin } from "@/lib/admin";
import type { OrderStatus } from "@/lib/types";
import { buildCustomerStatusMessage, sendTelegramMessage } from "@/lib/telegramBot";

function requireAdmin(request: Request) {
  const initData = request.headers.get("x-telegram-init-data");
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!initData || !botToken) return null;
  const user = getTelegramUser(initData, botToken);
  if (!user || !isAdmin(user.id)) return null;
  return user;
}

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json(getOrders());
}

export async function PUT(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const body = (await request.json()) as { id?: string; status?: OrderStatus };
  if (!body.id || !body.status) {
    return NextResponse.json({ ok: false, error: "ID и статус обязательны" }, { status: 400 });
  }
  const updated = updateOrderStatus(body.id, body.status);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Заказ не найден" }, { status: 404 });
  }
  if (updated.telegramUserId) {
    await sendTelegramMessage(updated.telegramUserId, buildCustomerStatusMessage(updated));
  }
  return NextResponse.json(updated);
}

export async function PATCH(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const body = (await request.json()) as { id?: string; deliveryPrice?: number };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "ID обязателен" }, { status: 400 });
  }
  const updated = replaceOrder(body.id, {
    deliveryPrice: body.deliveryPrice ?? 0
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Заказ не найден" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
