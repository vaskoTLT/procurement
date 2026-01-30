const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Get all product presets (dishes)
router.get('/presets', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pp.id, pp.name, pp.icon, pp.is_dish,
             (SELECT COUNT(*) FROM preset_products WHERE preset_id = pp.id) as product_count
      FROM product_presets pp
      WHERE pp.is_dish = true
      ORDER BY pp.name ASC
    `);

    res.json({ success: true, presets: result.rows });
  } catch (error) {
    console.error('Error getting product presets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get products for a specific preset (dish)
router.get('/presets/:presetId/products', async (req, res) => {
  try {
    const presetId = req.params.presetId;

    // Get preset info
    const presetResult = await db.query(
      'SELECT id, name, icon FROM product_presets WHERE id = $1',
      [presetId]
    );

    if (presetResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Preset not found' });
    }

    // Get products for this preset
    const productsResult = await db.query(
      `SELECT id, name, unit, default_quantity, category
       FROM preset_products
       WHERE preset_id = $1
       ORDER BY name ASC`,
      [presetId]
    );

    res.json({
      success: true,
      preset: presetResult.rows[0],
      products: productsResult.rows
    });
  } catch (error) {
    console.error('Error getting preset products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all individual products
router.get('/products', async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;

    let query = `
      SELECT id, name, unit, category
      FROM individual_products
    `;
    const params = [];

    let whereClauses = [];
    if (search) {
      whereClauses.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }
    if (category) {
      whereClauses.push(`category = $${params.length + 1}`);
      params.push(category);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY name ASC';

    const result = await db.query(query, params);

    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Error getting individual products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search products (both presets and individual products)
router.get('/search', async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, presets: [], products: [] });
    }

    // Search in presets
    const presetsResult = await db.query(
      `SELECT id, name, icon, is_dish
       FROM product_presets
       WHERE name ILIKE $1 AND is_dish = true
       ORDER BY name ASC
       LIMIT 10`,
      [`%${q}%`]
    );

    // Search in individual products
    const productsResult = await db.query(
      `SELECT id, name, unit, category
       FROM individual_products
       WHERE name ILIKE $1
       ORDER BY name ASC
       LIMIT 10`,
      [`%${q}%`]
    );

    res.json({
      success: true,
      presets: presetsResult.rows,
      products: productsResult.rows
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;