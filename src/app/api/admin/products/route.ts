import { NextResponse } from "next/server";
import { createProduct, deleteProduct, getProducts, updateProduct } from "@/lib/store";
import { getTelegramUser } from "@/lib/telegram";
import { isAdmin } from "@/lib/admin";
import type { Product } from "@/lib/types";
import { validateProductInput } from "@/lib/validation";

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
  return NextResponse.json(getProducts());
}

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const body = (await request.json()) as Product;
  const error = validateProductInput(body);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  const product = createProduct(body);
  return NextResponse.json(product);
}

export async function PUT(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const body = (await request.json()) as Partial<Product> & { id?: string };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "ID обязателен" }, { status: 400 });
  }
  if (body.price !== undefined && body.price < 0) {
    return NextResponse.json({ ok: false, error: "Цена не может быть отрицательной" }, { status: 400 });
  }
  if (body.stock !== undefined && body.stock < 0) {
    return NextResponse.json({ ok: false, error: "Остаток не может быть отрицательным" }, { status: 400 });
  }
  const updated = updateProduct(body.id, body);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Товар не найден" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "ID обязателен" }, { status: 400 });
  }
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
