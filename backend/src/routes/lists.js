const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Получить все списки
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, 
             u.username as creator_name,
             COUNT(i.id) as item_count,
             SUM(CASE WHEN i.is_bought THEN 1 ELSE 0 END) as bought_count,
             COALESCE(SUM(CASE WHEN i.is_bought THEN i.price ELSE 0 END), 0) as total_spent
      FROM shopping_lists l
      LEFT JOIN users u ON l.created_by = u.id
      LEFT JOIN items i ON l.id = i.list_id
      GROUP BY l.id, u.username
      ORDER BY l.created_at DESC
    `);
    res.json({ success: true, lists: result.rows });
  } catch (error) {
    console.error('Error getting lists:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Создать список
router.post('/', async (req, res) => {
  try {
    const { name, is_public = true } = req.body;
    const result = await db.query(
      'INSERT INTO shopping_lists (name, is_public) VALUES ($1, $2) RETURNING *',
      [name, is_public]
    );
    res.json({ success: true, list: result.rows[0] });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Удалить список
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM shopping_lists WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'List deleted' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
