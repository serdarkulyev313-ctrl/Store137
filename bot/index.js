const { Bot, InlineKeyboard } = require("grammy");
const { readOrders, updateOrderStatus } = require("./storage");

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN missing");
  process.exit(1);
}

const adminIds = (process.env.ADMIN_TG_IDS || "")
  .split(",")
  .map((id) => Number(id.trim()))
  .filter((id) => !Number.isNaN(id));

const miniAppUrl = process.env.MINI_APP_URL || "";

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("🛒 Открыть магазин", miniAppUrl || "https://example.com");
  if (adminIds.includes(ctx.from.id)) {
    keyboard.row().webApp("🔧 Админка", `${miniAppUrl}/admin`);
  }
  await ctx.reply("Добро пожаловать в Store 137!", { reply_markup: keyboard });
});

bot.callbackQuery(/order:(.+):(.+)/, async (ctx) => {
  const orderId = ctx.match[1];
  const action = ctx.match[2];
  if (!adminIds.includes(ctx.from.id)) {
    await ctx.answerCallbackQuery({ text: "Нет доступа" });
    return;
  }

  const statusMap = {
    confirm: "Подтверждён",
    cancel: "Отменён",
    delivery: "В доставке",
    ready: "Готов к выдаче",
    done: "Завершён"
  };
  const status = statusMap[action];
  if (!status) {
    await ctx.answerCallbackQuery({ text: "Неизвестное действие" });
    return;
  }

  const updated = updateOrderStatus(orderId, status);
  if (!updated) {
    await ctx.answerCallbackQuery({ text: "Заявка не найдена" });
    return;
  }

  await ctx.answerCallbackQuery({ text: `Статус: ${status}` });

  if (updated.telegramUserId) {
    await bot.api.sendMessage(updated.telegramUserId, `Статус заявки №${updated.number}: ${status}.`);
  }
});

bot.command("orders", async (ctx) => {
  if (!adminIds.includes(ctx.from.id)) {
    return;
  }
  const orders = readOrders().slice(0, 5);
  if (!orders.length) {
    await ctx.reply("Пока нет заявок.");
    return;
  }
  for (const order of orders) {
    const keyboard = new InlineKeyboard()
      .text("Подтвердить", `order:${order.id}:confirm`)
      .text("Отменить", `order:${order.id}:cancel`)
      .row()
      .text("В доставке", `order:${order.id}:delivery`)
      .text("Готов к выдаче", `order:${order.id}:ready`)
      .row()
      .text("Завершён", `order:${order.id}:done`);

    const items = order.items
      .map((item) => `• ${item.title} x${item.quantity}`)
      .join("\n");
    await ctx.reply(
      `Заявка №${order.number}\n${items}\nСумма: ${order.totalPrice} ₽\nСпособ: ${order.deliveryMethod}`,
      { reply_markup: keyboard }
    );
  }
});

bot.start();
