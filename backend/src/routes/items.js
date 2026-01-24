const express = require('express');
const router = express.Router();
const ItemModel = require('../models/ItemModel');

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

// Переключить статус покупки
router.put('/:id/toggle', async (req, res) => {
  try {
    const item = await ItemModel.toggleBought(req.params.id);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error toggling item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить цену
router.put('/:id', async (req, res) => {
  try {
    const { price } = req.body;
    const item = await ItemModel.updatePrice(req.params.id, price);
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating item:', error);
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
