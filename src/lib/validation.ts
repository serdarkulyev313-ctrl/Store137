import type { OrderItem, Product } from "./types";

export function clampNonNegative(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

export function validateProductInput(input: Product) {
  if (!input.title || !input.category || !input.brand) {
    return "Заполните название, категорию и бренд.";
  }
  if (!input.images?.length) {
    return "Добавьте хотя бы одно фото.";
  }
  if (input.price < 0 || input.stock < 0) {
    return "Цена и остаток не могут быть отрицательными.";
  }
  return null;
}

export function validateOrderItems(items: OrderItem[]) {
  if (!items.length) {
    return "Корзина пуста.";
  }
  for (const item of items) {
    if (!item.productId || item.quantity <= 0) {
      return "Некорректная позиция заказа.";
    }
  }
  return null;
}
