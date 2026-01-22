const db = require('./database');

class ItemModel {
  // Создать элемент
  static async create(listId, itemData, userId = null) {
    const { name, quantity, unit, price, category } = itemData;
    
    const result = await db.query(
      `INSERT INTO items (list_id, name, quantity, unit, price, category, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [listId, name, quantity, unit, price, category, userId]
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

  // Обновить статус покупки
  static async toggleBought(itemId) {
    const result = await db.query(
      `UPDATE items 
       SET is_bought = NOT is_bought,
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

  // Удалить элемент
  static async delete(itemId) {
    await db.query('DELETE FROM items WHERE id = $1', [itemId]);
  }
}

module.exports = ItemModel;
