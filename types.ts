
export enum Unit {
  PCS = 'pcs',
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml'
}

export interface User {
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface ShareAccess {
  email: string;
  access: 'view' | 'edit';
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  price: number;
  isBought: boolean;
  category?: string;
  isGroup?: boolean;
  children?: ShoppingItem[];
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingItem[];
  isPinned?: boolean;
  ownerEmail?: string;
  sharedWith?: ShareAccess[];
}

export type AppView = 'home' | 'list-detail' | 'stats' | 'shared' | 'admin' | 'profile';
