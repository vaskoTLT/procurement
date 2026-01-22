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
  quantity: number;
  unit: Unit;
  price: number;
  isBought: boolean;
  category?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingItem[];
}
