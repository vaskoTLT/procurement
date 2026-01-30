const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load configuration from environment variables
const config = {
  user: process.env.DB_USER || 'procurement_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'procurement',
  password: process.env.DB_PASSWORD || 'procurement',
  port: process.env.DB_PORT || 5432,
};

async function loadProductPresets() {
  try {
    console.log('🚀 Starting product presets loading...');

    // Read the product presets file
    const presetsPath = path.join(__dirname, '../data/product_presets.json');
    const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

    // Connect to the database
    const pool = new Pool(config);
    const client = await pool.connect();

    console.log('🔌 Connected to database');

    // Create product_presets table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_presets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        icon VARCHAR(10) DEFAULT '',
        is_dish BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create preset_products table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS preset_products (
        id SERIAL PRIMARY KEY,
        preset_id INTEGER REFERENCES product_presets(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        unit VARCHAR(10) DEFAULT 'pcs',
        default_quantity NUMERIC(10,2) DEFAULT 1,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create individual_products table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS individual_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        unit VARCHAR(10) DEFAULT 'pcs',
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, unit)
      )
    `);

    console.log('✅ Database tables created/verified');

    // Clear existing data
    await client.query('DELETE FROM preset_products');
    await client.query('DELETE FROM product_presets');
    await client.query('DELETE FROM individual_products');

    console.log('🧹 Cleared existing product preset data');

    // Insert dish presets
    for (const category of presetsData.categories) {
      // Insert the preset
      const presetResult = await client.query(
        `INSERT INTO product_presets (name, icon, is_dish) VALUES ($1, $2, $3) RETURNING id`,
        [category.name, category.icon || '', true]
      );

      const presetId = presetResult.rows[0].id;

      // Insert products for this preset
      for (const product of category.products) {
        await client.query(
          `INSERT INTO preset_products (preset_id, name, unit, default_quantity, category)
           VALUES ($1, $2, $3, $4, $5)`,
          [presetId, product.name, product.unit, product.default_quantity, product.category]
        );
      }

      console.log(`✅ Added preset: ${category.name} with ${category.products.length} products`);
    }

    // Insert individual products
    for (const product of presetsData.individual_products) {
      await client.query(
        `INSERT INTO individual_products (name, unit, category)
         VALUES ($1, $2, $3)
         ON CONFLICT (name, unit) DO NOTHING`,
        [product.name, product.unit, product.category]
      );
    }

    console.log(`✅ Added ${presetsData.individual_products.length} individual products`);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_preset_products_preset_id ON preset_products(preset_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_preset_products_name ON preset_products(name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_individual_products_name ON individual_products(name)');

    console.log('🎯 Created performance indexes');

    // Release the client
    client.release();

    console.log('🎉 Product presets loaded successfully!');
    console.log(`📊 Summary: ${presetsData.categories.length} dish presets, ${presetsData.individual_products.length} individual products`);

    return true;
  } catch (error) {
    console.error('❌ Error loading product presets:', error);
    return false;
  }
}

// Run the script
if (require.main === module) {
  loadProductPresets()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { loadProductPresets };