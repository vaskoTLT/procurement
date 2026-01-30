export enum Unit {
  PCS = 'pcs',
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
}

export type AppView = 'home' | 'list-detail' | 'stats';

// Подсписок - отдельная покупка товара
export interface ItemPurchase {
  id: number;
  item_id: number;
  quantity: number;
  price_per_unit?: number | null;
  purchase_date: string;
  notes?: string | null;
  is_purchased?: boolean;
  purchased_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;        // Запланированное количество
  purchasedQuantity?: number; // Уже купленное количество (deprecated, используем purchases)
  unit: Unit;
  price: number;          // Цена за единицу или за всё
  isBought: boolean;      // Куплен полностью?
  category?: string;
  notes?: string;
  actual_purchase_price?: number;
  purchases?: ItemPurchase[]; // Подсписки покупок
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingItem[];
  description?: string;
  is_public?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  is_owner?: boolean;
}

// Вспомогательный тип для подпунктов
export interface SubItem {
  index: number;          // Номер подпункта (1, 2, 3...)
  isPurchased: boolean;   // Куплен ли этот подпункт
}
