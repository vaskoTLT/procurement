import { ShoppingList, ShoppingItem, Unit, ItemPurchase } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private telegramId: string | null = null;

  constructor() {
    // Загружаем telegram_id из localStorage при инициализации
    this.telegramId = localStorage.getItem('telegramId');
  }

  /**
   * Получить telegram_id из Telegram WebApp API
   */
  getTelegramData() {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg || !tg.initData) {
      return null;
    }

    // Парсим initData чтобы получить user объект
    const initData = new URLSearchParams(tg.initData);
    const user = initData.get('user');
    
    if (!user) {
      return null;
    }

    try {
      const userData = JSON.parse(user);
      return userData;
    } catch (error) {
      console.error('❌ Ошибка при парсинге Telegram данных:', error);
      return null;
    }
  }

  /**
   * Проверить авторизацию через Telegram ID
   */
  async checkAuth(): Promise<boolean> {
    try {
      const userData = this.getTelegramData();
      
      if (!userData || !userData.id) {
        console.warn('⚠️ Telegram данные не найдены');
        console.warn('⚠️ Приложение должно открываться только через Telegram Mini App');
        return false;
      }

      const telegramId = userData.id.toString();
      
      // Проверяем авторизацию на бэкенде
      const response = await fetch(`${API_BASE}/auth/check`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Id': telegramId,
          'X-Telegram-WebApp': 'true'
        }
      });

      const data = await response.json();

      if (response.ok && data.authorized) {
        this.telegramId = telegramId;
        localStorage.setItem('telegramId', telegramId);
        console.log('✅ Пользователь авторизован. Telegram ID:', telegramId);
        return true;
      }

      // Различаем типы ошибок
      if (data.error === 'UNAUTHORIZED') {
        console.error('❌ Ошибка: Приложение должно открываться только через Telegram Mini App');
      } else if (data.error === 'ACCESS_DENIED') {
        console.error('❌ Доступ запрещен. Ваш Telegram ID не авторизован.');
      } else {
        console.error('❌ Ошибка авторизации:', data.message);
      }
      
      return false;
    } catch (error) {
      console.error('❌ Ошибка при проверке авторизации:', error);
      return false;
    }
  }

  /**
   * Получить информацию о текущем пользователе
   */
  async getCurrentUser(): Promise<any | null> {
    try {
      if (!this.telegramId) {
        return null;
      }

      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Id': this.telegramId,
          'X-Telegram-WebApp': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.success ? data.user : null;
      }

      return null;
    } catch (error) {
      console.error('❌ Ошибка при получении информации пользователя:', error);
      return null;
    }
  }

  /**
   * Выходить из системы (удалить telegram_id)
   */
  logout(): void {
    this.telegramId = null;
    localStorage.removeItem('telegramId');
    console.log('👋 Вы вышли из системы');
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.telegramId) {
      throw new Error('Не авторизован. Требуется telegram_id.');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Id': this.telegramId,
        'X-Telegram-WebApp': 'true',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        this.logout();
        const errorMsg = error.message || error.error || 'Доступ запрещен';
        if (errorMsg.includes('Telegram') || error.error === 'UNAUTHORIZED') {
          throw new Error('Приложение должно открываться только через Telegram Mini App');
        }
        throw new Error(errorMsg);
      }
      throw new Error(error.message || `API error: ${response.statusText}`);
    }

    return response.json();
  }

  private convertApiList(apiList: any): ShoppingList {
    return {
      id: apiList.id.toString(),
      name: apiList.name,
      createdAt: new Date(apiList.created_at).getTime(),
      description: apiList.description || '',
      is_public: apiList.is_public,
      created_by: apiList.created_by,
      created_at: apiList.created_at,
      updated_at: apiList.updated_at,
      is_owner: apiList.is_owner,
      items: []
    };
  }

  private convertApiItem(apiItem: any): ShoppingItem {
    return {
      id: apiItem.id.toString(),
      name: apiItem.name,
      quantity: parseFloat(apiItem.quantity),
      unit: apiItem.unit as Unit,
      price: parseFloat(apiItem.price),
      isBought: apiItem.is_bought,
      category: apiItem.category,
      notes: apiItem.notes || '',
      actual_purchase_price: apiItem.actual_purchase_price ? parseFloat(apiItem.actual_purchase_price) : undefined,
      purchases: apiItem.purchases ? apiItem.purchases.map((p: any) => ({
        ...p,
        quantity: parseFloat(p.quantity),
        price_per_unit: p.price_per_unit ? parseFloat(p.price_per_unit) : undefined
      })) : []
    };
  }

  async getLists(): Promise<ShoppingList[]> {
    try {
      const data = await this.fetch<{ success: boolean; lists: any[] }>('/lists');
      
      const listsWithItems = await Promise.all(
        data.lists.map(async (list: any) => {
          try {
            const itemsData = await this.fetch<{ success: boolean; items: any[] }>(`/items/list/${list.id}`);
            return {
              ...this.convertApiList(list),
              items: itemsData.success ? itemsData.items.map(this.convertApiItem.bind(this)) : []
            };
          } catch (error) {
            console.error(`Error loading items for list ${list.id}:`, error);
            return {
              ...this.convertApiList(list),
              items: []
            };
          }
        })
      );

      return listsWithItems;
    } catch (error) {
      console.error('Error in getLists:', error);
      return [];
    }
  }

  async getList(listId: string): Promise<ShoppingList | null> {
    try {
      const data = await this.fetch<{ success: boolean; list: any }>(`/lists/${listId}`);
      
      if (!data.success || !data.list) {
        return null;
      }

      const itemsData = await this.fetch<{ success: boolean; items: any[] }>(`/items/list/${listId}`);
      return {
        ...this.convertApiList(data.list),
        items: itemsData.success ? itemsData.items.map(this.convertApiItem.bind(this)) : []
      };
    } catch (error) {
      console.error(`Error loading list ${listId}:`, error);
      return null;
    }
  }

  async getItemsForList(listId: string): Promise<ShoppingItem[]> {
    try {
      const data = await this.fetch<{ success: boolean; items: any[] }>(`/items/list/${listId}`);
      return data.success ? data.items.map(this.convertApiItem.bind(this)) : [];
    } catch (error) {
      console.error(`Error loading items for list ${listId}:`, error);
      return [];
    }
  }

  async createList(name: string, description: string = ''): Promise<ShoppingList> {
    const data = await this.fetch<{ success: boolean; list: any }>('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, is_public: true, description }),
    });
    
    return {
      ...this.convertApiList(data.list),
      items: []
    };
  }

  async updateList(id: string, updates: { name?: string; description?: string; is_public?: boolean }): Promise<ShoppingList> {
    const data = await this.fetch<{ success: boolean; list: any }>(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    const list = this.convertApiList(data.list);
    const itemsData = await this.fetch<{ success: boolean; items: any[] }>(`/items/list/${id}`);
    return {
      ...list,
      items: itemsData.success ? itemsData.items.map(this.convertApiItem.bind(this)) : []
    };
  }

  async deleteList(id: string): Promise<void> {
    await this.fetch(`/lists/${id}`, { method: 'DELETE' });
  }

  async createItem(listId: string, itemData: Omit<ShoppingItem, 'id'>): Promise<ShoppingItem> {
    const data = await this.fetch<{ success: boolean; item: any }>('/items', {
      method: 'POST',
      body: JSON.stringify({
        ...itemData,
        list_id: parseInt(listId),
      }),
    });
    
    return this.convertApiItem(data.item);
  }

  async updateItem(itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const data = await this.fetch<{ success: boolean; item: any }>(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    return this.convertApiItem(data.item);
  }

  async toggleItem(itemId: string): Promise<ShoppingItem> {
    const data = await this.fetch<{ success: boolean; item: any }>(`/items/${itemId}/toggle`, {
      method: 'PUT',
    });
    
    return this.convertApiItem(data.item);
  }

  async updateItemPrice(itemId: string, price: number): Promise<ShoppingItem> {
    const data = await this.fetch<{ success: boolean; item: any }>(`/items/${itemId}/price`, {
      method: 'PUT',
      body: JSON.stringify({ price }),
    });
    
    return this.convertApiItem(data.item);
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.fetch(`/items/${itemId}`, { method: 'DELETE' });
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ПОДСПИСКАМИ =====

  async addItemPurchase(itemId: string, quantity: number, pricePerUnit?: number, notes?: string): Promise<ItemPurchase> {
    const data = await this.fetch<{ success: boolean; purchase: any }>(`/items/${itemId}/purchases`, {
      method: 'POST',
      body: JSON.stringify({ quantity, price_per_unit: pricePerUnit, notes }),
    });
    
    return {
      ...data.purchase,
      quantity: parseFloat(data.purchase.quantity),
      price_per_unit: data.purchase.price_per_unit ? parseFloat(data.purchase.price_per_unit) : undefined
    };
  }

  async getItemPurchases(itemId: string): Promise<ItemPurchase[]> {
    const data = await this.fetch<{ success: boolean; purchases: any[] }>(`/items/${itemId}/purchases`, {
      method: 'GET',
    });
    
    return data.success ? data.purchases.map(p => ({
      ...p,
      quantity: parseFloat(p.quantity),
      price_per_unit: p.price_per_unit ? parseFloat(p.price_per_unit) : undefined
    })) : [];
  }

  async updateItemPurchase(itemId: string, purchaseId: number, updates: { quantity?: number; price_per_unit?: number; notes?: string }): Promise<ItemPurchase> {
    const data = await this.fetch<{ success: boolean; purchase: any }>(`/items/${itemId}/purchases/${purchaseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    return {
      ...data.purchase,
      quantity: parseFloat(data.purchase.quantity),
      price_per_unit: data.purchase.price_per_unit ? parseFloat(data.purchase.price_per_unit) : undefined
    };
  }

  async deleteItemPurchase(itemId: string, purchaseId: number): Promise<void> {
    await this.fetch(`/items/${itemId}/purchases/${purchaseId}`, { method: 'DELETE' });
  }

  async toggleItemPurchase(itemId: string, purchaseId: number): Promise<ShoppingItem> {
    const data = await this.fetch<{ success: boolean; item: any }>(`/items/${itemId}/purchases/${purchaseId}/toggle`, {
      method: 'PUT',
    });
    
    return this.convertApiItem(data.item);
  }

  // Алиас для удобства
  async togglePurchase(itemId: string, purchaseId: number): Promise<ShoppingItem> {
    return this.toggleItemPurchase(itemId, purchaseId);
  }

  async updateItemPurchasePrice(itemId: string, purchaseId: number, pricePerUnit: number): Promise<ShoppingItem> {
    const data = await this.fetch<{ success: boolean; item: any }>(`/items/${itemId}/purchases/${purchaseId}/price`, {
      method: 'PUT',
      body: JSON.stringify({ price_per_unit: pricePerUnit }),
    });
    
    return this.convertApiItem(data.item);
  }

  async categorizeItem(itemName: string): Promise<string> {
    const categories: Record<string, string> = {
      молоко: 'Молочные',
      сыр: 'Сыр',
      хлеб: 'Хлеб',
      яйца: 'Яйца',
      мясо: 'Мясо',
      рыба: 'Рыба',
      овощи: 'Овощи',
      фрукты: 'Фрукты',
      вода: 'Напитки',
      мыло: 'Гигиена',
      порошок: 'Бытовая химия',
    };

    const lowerName = itemName.toLowerCase();
    for (const [key, category] of Object.entries(categories)) {
      if (lowerName.includes(key)) {
        return category;
      }
    }

    return 'General';
  }
}

export const apiService = new ApiService();

