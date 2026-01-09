"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";

function getInitData() {
  // @ts-expect-error Telegram WebApp runtime
  return window?.Telegram?.WebApp?.initData || "";
}

const statuses: OrderStatus[] = [
  "Создан",
  "Подтверждён",
  "В доставке",
  "Готов к выдаче",
  "Завершён",
  "Отменён"
];

export default function AdminOrders() {
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState("");

  useEffect(() => {
    async function load() {
      const initData = getInitData();
      const access = await fetch("/api/admin/me", { headers: { "x-telegram-init-data": initData } });
      setAuthorized(access.ok);
      if (!access.ok) return;
      const res = await fetch("/api/admin/orders", { headers: { "x-telegram-init-data": initData } });
      const data = (await res.json()) as Order[];
      setOrders(data);
    }
    load();
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    const initData = getInitData();
    const response = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData
      },
      body: JSON.stringify({ id: orderId, status })
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Order;
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
    setSelected(updated);
    setDeliveryPrice(String(updated.deliveryPrice));
  }

  async function updateDeliveryPrice(orderId: string) {
    const initData = getInitData();
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData
      },
      body: JSON.stringify({ id: orderId, deliveryPrice: Number(deliveryPrice) || 0 })
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Order;
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
    setSelected(updated);
  }

  if (!authorized) {
    return <div className="card">Нет доступа к админке.</div>;
  }

  return (
    <div className="space-y-6">
      <a className="text-sm text-slate-600" href="/admin">← Назад</a>
      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              className={`card text-left ${selected?.id === order.id ? "border-slate-400" : ""}`}
              onClick={() => {
                setSelected(order);
                setDeliveryPrice(String(order.deliveryPrice));
              }}
            >
              <div className="flex items-center justify-between">
                <strong>Заявка №{order.number}</strong>
                <span className="text-xs text-slate-500">{order.status}</span>
              </div>
              <p className="text-xs text-slate-500">{order.customerName} · {order.customerPhone}</p>
              <p className="text-xs text-slate-500">Сумма: {order.totalPrice} ₽</p>
            </button>
          ))}
        </div>
        <div className="card space-y-3">
          {!selected ? (
            <p className="text-sm text-slate-500">Выберите заявку слева.</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Заявка №{selected.number}</h2>
              <p className="text-sm text-slate-600">Статус: {selected.status}</p>
              <p className="text-sm">Покупатель: {selected.customerName}</p>
              <p className="text-sm">Телефон: {selected.customerPhone}</p>
              <p className="text-sm">Способ: {selected.deliveryMethod}</p>
              {selected.deliveryAddress ? <p className="text-sm">Адрес: {selected.deliveryAddress}</p> : null}
              <div className="space-y-1">
                {selected.items.map((item) => (
                  <div key={item.id} className="text-sm">• {item.title} x{item.quantity}</div>
                ))}
              </div>
              <p className="text-sm font-semibold">Сумма: {selected.totalPrice} ₽</p>
              <div className="space-y-2">
                <label className="label">Стоимость доставки (₽)</label>
                <div className="flex gap-2">
                  <input className="input" value={deliveryPrice} onChange={(event) => setDeliveryPrice(event.target.value)} />
                  <button className="button-secondary" onClick={() => updateDeliveryPrice(selected.id)}>
                    Обновить
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button key={status} className="button-secondary" onClick={() => updateStatus(selected.id, status)}>
                    {status}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
