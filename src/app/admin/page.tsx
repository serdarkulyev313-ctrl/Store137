"use client";

import { useEffect, useState } from "react";

function getInitData() {
  // @ts-expect-error Telegram WebApp runtime
  return window?.Telegram?.WebApp?.initData || "";
}

export default function AdminHome() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const initData = getInitData();
      const response = await fetch("/api/admin/me", {
        headers: {
          "x-telegram-init-data": initData
        }
      });
      setAuthorized(response.ok);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="card">Проверка доступа...</div>;
  }

  if (!authorized) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold">Нет доступа</h1>
        <p className="text-sm text-slate-600">Админка доступна только из Telegram и для администраторов.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold">Админка Store 137</h1>
        <p className="text-sm text-slate-600">Управляйте товарами и заявками.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <a className="card hover:border-slate-400" href="/admin/products">
          <h2 className="text-lg font-semibold">Товары</h2>
          <p className="text-sm text-slate-600">Добавить, редактировать и выключать товары.</p>
        </a>
        <a className="card hover:border-slate-400" href="/admin/orders">
          <h2 className="text-lg font-semibold">Заказы</h2>
          <p className="text-sm text-slate-600">Подтверждение, статусы и просмотр заявок.</p>
        </a>
      </div>
    </div>
  );
}
