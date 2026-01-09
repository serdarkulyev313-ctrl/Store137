import { NextResponse } from "next/server";
import { getTelegramUser } from "@/lib/telegram";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const initData = request.headers.get("x-telegram-init-data");
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!initData || !botToken) {
    return NextResponse.json({ ok: false, reason: "initData missing" }, { status: 401 });
  }
  const user = getTelegramUser(initData, botToken);
  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ ok: false, reason: "not admin" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, user });
}
