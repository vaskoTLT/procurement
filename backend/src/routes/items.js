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

module.exports = router;
