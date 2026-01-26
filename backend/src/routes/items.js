const express = require('express');
const router = express.Router();
const ItemModel = require('../models/ItemModel');
const db = require('../models/database');

// Получить товары списка
router.get('/list/:listId', async (req, res) => {
  try {
    const items = await ItemModel.findByListId(req.params.listId);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Получить один товар с подсписками
router.get('/:id', async (req, res) => {
  try {
    const item = await ItemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error getting item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Создать товар
router.post('/', async (req, res) => {
  try {
    const { list_id, name, quantity = 1, unit = 'pcs', price = 0, category = 'General' } = req.body;
    
    const item = await ItemModel.create(list_id, {
      name,
      quantity,
      unit,
      price,
      category
    }, 1);
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить товар (все поля)
router.put('/:id', async (req, res) => {
  try {
    const { name, quantity, unit, price, category, notes, actual_purchase_price } = req.body;
    const item = await ItemModel.update(req.params.id, {
      name,
      quantity,
      unit,
      price,
      category,
      notes,
      actual_purchase_price
    });
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Увеличить купленное количество
router.put('/:id/increment', async (req, res) => {
  try {
    const item = await ItemModel.incrementPurchased(req.params.id);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error incrementing purchased quantity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Уменьшить купленное количество
router.put('/:id/decrement', async (req, res) => {
  try {
    const item = await ItemModel.decrementPurchased(req.params.id);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error decrementing purchased quantity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить купленное количество
router.put('/:id/purchased', async (req, res) => {
  try {
    const { purchased_quantity } = req.body;
    const item = await ItemModel.updatePurchasedQuantity(req.params.id, purchased_quantity);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating purchased quantity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить цену
router.put('/:id/price', async (req, res) => {
  try {
    const { price } = req.body;
    const item = await ItemModel.updatePrice(req.params.id, price);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating item price:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить количество
router.put('/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await ItemModel.updateQuantity(req.params.id, quantity);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить название
router.put('/:id/name', async (req, res) => {
  try {
    const { name } = req.body;
    const item = await ItemModel.updateName(req.params.id, name);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating item name:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Переключить статус покупки (toggle) - ПРОСТАЯ ВЕРСИЯ
router.put('/:id/toggle', async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Получаем текущий товар
    const result = await db.query(
      'SELECT is_bought, purchased_quantity, quantity FROM items WHERE id = $1',
      [itemId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    
    const item = result.rows[0];
    
    // Простой toggle: меняем is_bought на противоположное
    // Если был куплен (is_bought=true) - сбрасываем purchased_quantity=0, is_bought=false
    // Если не куплен (is_bought=false) - устанавливаем purchased_quantity=quantity, is_bought=true
    const newIsBought = !item.is_bought;
    const newPurchasedQuantity = newIsBought ? item.quantity : 0;
    
    const updateResult = await db.query(
      `UPDATE items 
       SET purchased_quantity = $1,
           is_bought = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [newPurchasedQuantity, newIsBought, itemId]
    );
    
    res.json({ success: true, item: updateResult.rows[0] });
  } catch (error) {
    console.error('Error toggling item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Удалить товар
router.delete('/:id', async (req, res) => {
  try {
    await ItemModel.delete(req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ENDPOINT ДЛЯ ПОДСПИСКОВ =====

// Добавить подсписок товара
router.post('/:id/purchases', async (req, res) => {
  try {
    const { quantity, price_per_unit, notes } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Количество должно быть больше 0' });
    }
    
    const purchase = await ItemModel.addPurchase(req.params.id, quantity, price_per_unit, notes);
    res.json({ success: true, purchase });
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Получить все подсписки товара
router.get('/:id/purchases', async (req, res) => {
  try {
    const purchases = await ItemModel.getPurchases(req.params.id);
    res.json({ success: true, purchases });
  } catch (error) {
    console.error('Error getting purchases:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить подсписок
router.put('/:id/purchases/:purchaseId', async (req, res) => {
  try {
    const { quantity, price_per_unit, notes } = req.body;
    
    if (quantity && quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Количество должно быть больше 0' });
    }
    
    const purchase = await ItemModel.updatePurchase(req.params.purchaseId, quantity, price_per_unit, notes);
    res.json({ success: true, purchase });
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Удалить подсписок (уменьшает количество товара на 1)
router.delete('/:id/purchases/:purchaseId', async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Получаем текущий товар
    const itemResult = await db.query('SELECT quantity FROM items WHERE id = $1', [itemId]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    
    const currentQuantity = parseFloat(itemResult.rows[0].quantity);
    const newQuantity = Math.max(0, currentQuantity - 1);
    
    // Удаляем подсписок
    await db.query('DELETE FROM item_purchases WHERE id = $1', [req.params.purchaseId]);
    
    // Обновляем количество товара
    const result = await db.query(
      `UPDATE items 
       SET quantity = $1,
           is_bought = (purchased_quantity >= $1),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newQuantity, itemId]
    );
    
    // Возвращаем обновленный товар с подсписками
    const purchasesResult = await db.query(
      `SELECT i.*, 
              (SELECT json_agg(json_build_object('id', id, 'quantity', quantity, 'price_per_unit', price_per_unit, 'notes', notes, 'purchase_date', purchase_date)) 
               FROM item_purchases 
               WHERE item_id = i.id) as purchases
       FROM items i WHERE i.id = $1`,
      [itemId]
    );
    
    const item = purchasesResult.rows[0];
    item.purchases = item.purchases || [];
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
