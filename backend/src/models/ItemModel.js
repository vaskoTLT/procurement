const db = require('./database');

class ItemModel {
  // Создать элемент
  static async create(listId, itemData, userId = null) {
    const { name, quantity, unit, price, category } = itemData;
    
    const result = await db.query(
      `INSERT INTO items (list_id, name, quantity, purchased_quantity, unit, price, category, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [listId, name, quantity, 0, unit, price, category, userId]
    );
    
    return result.rows[0];
  }

  // Получить все элементы списка с подсписками
  static async findByListId(listId) {
    const result = await db.query(
      `SELECT i.*
       FROM items i
       WHERE i.list_id = $1
       ORDER BY i.created_at DESC`,
      [listId]
    );
    
    // Загружаем подсписки для каждого товара
    const itemsWithPurchases = await Promise.all(
      result.rows.map(async (item) => {
        const purchasesResult = await db.query(
          `SELECT * FROM item_purchases WHERE item_id = $1 ORDER BY purchase_date ASC`,
          [item.id]
        );
        return {
          ...item,
          purchases: purchasesResult.rows || []
        };
      })
    );
    
    return itemsWithPurchases;
  }

  // Получить один товар с подсписками
  static async findById(itemId) {
    const itemResult = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);
    if (itemResult.rows.length === 0) return null;

    const item = itemResult.rows[0];
    const purchasesResult = await db.query(
      `SELECT * FROM item_purchases WHERE item_id = $1 ORDER BY purchase_date ASC`,
      [itemId]
    );

    return {
      ...item,
      purchases: purchasesResult.rows || []
    };
  }

  // Обновить купленное количество
  static async updatePurchasedQuantity(itemId, purchasedQuantity) {
    const result = await db.query(
      `UPDATE items 
       SET purchased_quantity = $1,
           is_bought = ($1 >= quantity),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [purchasedQuantity, itemId]
    );
    
    // Загружаем подсписки для обновленного товара
    const item = result.rows[0];
    const purchasesResult = await db.query(
      `SELECT * FROM item_purchases WHERE item_id = $1 ORDER BY purchase_date ASC`,
      [itemId]
    );

    return {
      ...item,
      purchases: purchasesResult.rows || []
    };
  }

  // Увеличить купленное количество на 1 единицу
  static async incrementPurchased(itemId) {
    const result = await db.query(
      `UPDATE items 
       SET purchased_quantity = LEAST(purchased_quantity + 1, quantity),
           is_bought = (purchased_quantity + 1 >= quantity),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [itemId]
    );
    return result.rows[0];
  }

  // Уменьшить купленное количество на 1 единицу
  static async decrementPurchased(itemId) {
    const result = await db.query(
      `UPDATE items 
       SET purchased_quantity = GREATEST(purchased_quantity - 1, 0),
           is_bought = (purchased_quantity - 1 >= quantity),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [itemId]
    );
    return result.rows[0];
  }

  // Обновить цену
  static async updatePrice(itemId, price) {
    const result = await db.query(
      `UPDATE items 
       SET price = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [price, itemId]
    );
    return result.rows[0];
  }

  // Обновить количество
  static async updateQuantity(itemId, quantity) {
    const result = await db.query(
      `UPDATE items 
       SET quantity = $1,
           is_bought = (purchased_quantity >= $1),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quantity, itemId]
    );
    return result.rows[0];
  }

  // Обновить название
  static async updateName(itemId, name) {
    const result = await db.query(
      `UPDATE items 
       SET name = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [name, itemId]
    );
    return result.rows[0];
  }

  // Удалить элемент
  static async delete(itemId) {
    await db.query('DELETE FROM items WHERE id = $1', [itemId]);
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ПОДСПИСКАМИ =====

  // Добавить подсписок (подпокупку)
  static async addPurchase(itemId, quantity, pricePerUnit = null, notes = null) {
    const result = await db.query(
      `INSERT INTO item_purchases (item_id, quantity, price_per_unit, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [itemId, quantity, pricePerUnit, notes]
    );
    return result.rows[0];
  }

  // Получить все подсписки товара
  static async getPurchases(itemId) {
    const result = await db.query(
      `SELECT * FROM item_purchases WHERE item_id = $1 ORDER BY purchase_date ASC`,
      [itemId]
    );
    return result.rows;
  }

  // Обновить подсписок
  static async updatePurchase(purchaseId, quantity, pricePerUnit = null, notes = null) {
    const result = await db.query(
      `UPDATE item_purchases 
       SET quantity = $1, price_per_unit = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [quantity, pricePerUnit, notes, purchaseId]
    );
    return result.rows[0];
  }

  // Удалить подсписок
  static async deletePurchase(purchaseId) {
    const purchaseResult = await db.query(
      `SELECT item_id FROM item_purchases WHERE id = $1`,
      [purchaseId]
    );
    
    if (purchaseResult.rows.length === 0) {
      throw new Error('Подсписок не найден');
    }

    await db.query('DELETE FROM item_purchases WHERE id = $1', [purchaseId]);
    
    // Триггер автоматически пересчитает purchased_quantity
    return purchaseResult.rows[0];
  }

  // ===== МЕТОДЫ ДЛЯ РЕДАКТИРОВАНИЯ ТОВАРА =====

  // Редактировать все поля товара
  static async update(itemId, updateData) {
    const { name, quantity, unit, price, category, notes, actual_purchase_price } = updateData;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount}`);
      values.push(quantity);
      paramCount++;
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramCount}`);
      values.push(unit);
      paramCount++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }
    if (actual_purchase_price !== undefined) {
      updates.push(`actual_purchase_price = $${paramCount}`);
      values.push(actual_purchase_price);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findById(itemId);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(itemId);

    const result = await db.query(
      `UPDATE items 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }
}

module.exports = ItemModel;
