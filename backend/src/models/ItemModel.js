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

  // Получить все элементы списка
  static async findByListId(listId) {
    const result = await db.query(
      `SELECT i.*
       FROM items i
       WHERE i.list_id = $1
       ORDER BY i.created_at DESC`,
      [listId]
    );
    return result.rows;
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
    return result.rows[0];
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
}

module.exports = ItemModel;
