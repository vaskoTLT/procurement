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

// Получить один список
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM shopping_lists WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Список не найден' });
    }
    
    res.json({ success: true, list: result.rows[0] });
  } catch (error) {
    console.error('Error getting list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Создать список
router.post('/', async (req, res) => {
  try {
    const { name, is_public = true, description = '' } = req.body;
    const result = await db.query(
      'INSERT INTO shopping_lists (name, is_public, created_by, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, is_public, 1, description]
    );
    res.json({ success: true, list: result.rows[0] });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить список (имя, описание, и другие поля)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, is_public } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount}`);
      values.push(is_public);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Нет данных для обновления' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    const result = await db.query(
      `UPDATE shopping_lists 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Список не найден' });
    }

    res.json({ success: true, list: result.rows[0] });
  } catch (error) {
    console.error('Error updating list:', error);
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
