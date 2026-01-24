export enum Unit {
  PCS = 'pcs',
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
}

export type AppView = 'home' | 'list-detail' | 'stats';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;        // Запланированное количество
  purchasedQuantity: number; // Уже купленное количество
  unit: Unit;
  price: number;          // Цена за единицу
  isBought: boolean;      // Куплен полностью?
  category?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingItem[];
}

// Вспомогательный тип для подпунктов
export interface SubItem {
  index: number;          // Номер подпункта (1, 2, 3...)
  isPurchased: boolean;   // Куплен ли этот подпункт
}
