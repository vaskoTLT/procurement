
export enum UnitType {
  PCS = 'шт',
  G = 'г',
  KG = 'кг'
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
  price: number; // Price per unit/kg
  isBought: boolean;
  category?: string;
}

export interface ShoppingList {
  id: string;
  title: string;
  date: string;
  items: ShoppingItem[];
  isArchived: boolean;
}

export interface AppState {
  activeLists: ShoppingList[];
  history: ShoppingList[];
  activeListId: string | null;
}
