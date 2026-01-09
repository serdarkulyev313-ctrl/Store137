import type { Order } from "./types";

const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramMessage(chatId: number, text: string, extra?: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN не задан");
    return;
  }
  await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...extra
    })
  });
}

export function buildAdminOrderMessage(order: Order) {
  const lines = [
    `🆕 Новая заявка №${order.number}`,
    `Способ получения: ${order.deliveryMethod}`,
    `Телефон: ${order.customerPhone}`,
    order.deliveryAddress ? `Адрес: ${order.deliveryAddress}` : null,
    `Сумма: ${order.totalPrice} ₽`
  ].filter(Boolean);

  const items = order.items
    .map((item) => `• ${item.title} x${item.quantity} — ${item.price * item.quantity} ₽`)
    .join("\n");

  return `${lines.join("\n")}\n\n${items}`;
}

export function buildCustomerStatusMessage(order: Order) {
  return `Статус заявки №${order.number}: ${order.status}.`;
}
