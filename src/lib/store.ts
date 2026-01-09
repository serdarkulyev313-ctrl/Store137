import { nanoid } from "nanoid";
import { readJson, writeJson } from "./storage";
import type { Order, OrderItem, OrderStatus, Product } from "./types";

const PRODUCTS_FILE = "products.json";
const ORDERS_FILE = "orders.json";

export function getProducts() {
  return readJson<Product[]>(PRODUCTS_FILE, []);
}

export function saveProducts(products: Product[]) {
  writeJson(PRODUCTS_FILE, products);
}

export function getOrders() {
  return readJson<Order[]>(ORDERS_FILE, []);
}

export function saveOrders(orders: Order[]) {
  writeJson(ORDERS_FILE, orders);
}

export function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const product: Product = {
    ...data,
    id: nanoid(),
    createdAt: now,
    updatedAt: now
  };
  const products = getProducts();
  products.push(product);
  saveProducts(products);
  return product;
}

export function updateProduct(productId: string, update: Partial<Product>) {
  const products = getProducts();
  const index = products.findIndex((item) => item.id === productId);
  if (index === -1) {
    return null;
  }
  const updated: Product = {
    ...products[index],
    ...update,
    updatedAt: new Date().toISOString()
  };
  products[index] = updated;
  saveProducts(products);
  return updated;
}

export function deleteProduct(productId: string) {
  const products = getProducts();
  const next = products.filter((item) => item.id !== productId);
  saveProducts(next);
}

export function createOrder(data: Omit<Order, "id" | "number" | "createdAt" | "updatedAt">) {
  const orders = getOrders();
  const now = new Date().toISOString();
  const order: Order = {
    ...data,
    id: nanoid(),
    number: String(orders.length + 1001),
    createdAt: now,
    updatedAt: now
  };
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orders = getOrders();
  const index = orders.findIndex((item) => item.id === orderId);
  if (index === -1) return null;
  const updated: Order = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString()
  };
  orders[index] = updated;
  saveOrders(orders);
  return updated;
}

export function replaceOrder(orderId: string, update: Partial<Order>) {
  const orders = getOrders();
  const index = orders.findIndex((item) => item.id === orderId);
  if (index === -1) return null;
  const base = orders[index];
  const nextDeliveryPrice = update.deliveryPrice ?? base.deliveryPrice;
  const nextTotalPrice = base.totalItems + nextDeliveryPrice;
  const updated: Order = {
    ...base,
    ...update,
    deliveryPrice: nextDeliveryPrice,
    totalPrice: nextTotalPrice,
    updatedAt: new Date().toISOString()
  };
  orders[index] = updated;
  saveOrders(orders);
  return updated;
}

export function buildOrderItemsTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
