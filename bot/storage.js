const fs = require("fs");
const path = require("path");

const dataDir = path.join(process.cwd(), "data");
const ordersFile = path.join(dataDir, "orders.json");

function ensureFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
  }
}

function readOrders() {
  ensureFile();
  const raw = fs.readFileSync(ordersFile, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  ensureFile();
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

function updateOrderStatus(orderId, status) {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) return null;
  orders[index] = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString()
  };
  writeOrders(orders);
  return orders[index];
}

module.exports = {
  readOrders,
  updateOrderStatus
};
