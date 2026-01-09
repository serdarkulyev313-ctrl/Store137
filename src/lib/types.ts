export type ProductCondition = "new" | "used";

export type ProductCharacteristic = {
  label: string;
  value: string;
};

export type VariantOption = {
  id: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
};

export type VariantGroup = {
  id: string;
  name: string;
  options: VariantOption[];
};

export type Product = {
  id: string;
  title: string;
  category: string;
  brand: string;
  condition: ProductCondition;
  description: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  active: boolean;
  images: string[];
  characteristics: ProductCharacteristic[];
  variants?: VariantGroup[];
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | "Создан"
  | "Подтверждён"
  | "В доставке"
  | "Готов к выдаче"
  | "Завершён"
  | "Отменён";

export type PaymentStatus = "Не оплачено" | "Оплачено наличными";

export type OrderItem = {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  variantSelections?: {
    groupId: string;
    groupName: string;
    optionId: string;
    optionTitle: string;
  }[];
};

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  totalItems: number;
  deliveryMethod: "Курьер" | "Самовывоз";
  deliveryAddress?: string | null;
  deliveryPrice: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerComment?: string | null;
  telegramUserId?: number | null;
};
