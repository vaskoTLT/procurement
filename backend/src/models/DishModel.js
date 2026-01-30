const db = require('./database');
const ItemModel = require('./ItemModel');

class DishModel {
  // Create a dish item (contains multiple products)
  static async createDish(listId, dishData, userId = null) {
    const { name, description = '', products = [] } = dishData;

    console.log('🍽️ Creating dish:', { listId, name, products });

    // Create the main dish item
    const dishItem = await ItemModel.create(listId, {
      name: name,
      quantity: 1,
      unit: 'dish',
      price: 0,
      category: 'Dishes'
    }, userId);

    const dishItemId = dishItem.id;

    console.log('✅ Dish item created:', dishItemId);

    // Create individual product items for this dish
    const productItems = [];
    let totalPrice = 0;

    for (const product of products) {
      const { name, quantity, unit, price, category } = product;

      console.log(`📦 Adding product to dish: ${name} (${quantity} ${unit})`);

      // Create the product item linked to the dish
      const productItem = await ItemModel.create(listId, {
        name: name,
        quantity: quantity,
        unit: unit,
        price: price || 0,
        category: category || 'General'
      }, userId);

      // Link this product to the dish
      await db.query(
        `INSERT INTO dish_products (dish_item_id, product_item_id, quantity)
         VALUES ($1, $2, $3)`,
        [dishItemId, productItem.id, quantity]
      );

      productItems.push(productItem);
      totalPrice += (price || 0) * quantity;

      console.log(`✅ Product added: ${productItem.id}`);
    }

    // Update the dish item with the total price
    await db.query(
      `UPDATE items
       SET price = $1, notes = $2
       WHERE id = $3`,
      [totalPrice, description]
    );

    console.log(`💰 Total dish price: ${totalPrice}`);

    return {
      ...dishItem,
      products: productItems,
      total_price: totalPrice
    };
  }

  // Get all products for a dish
  static async getDishProducts(dishItemId) {
    const result = await db.query(
      `SELECT dp.quantity, i.*
       FROM dish_products dp
       JOIN items i ON dp.product_item_id = i.id
       WHERE dp.dish_item_id = $1
       ORDER BY i.created_at ASC`,
      [dishItemId]
    );

    return result.rows;
  }

  // Check if an item is a dish
  static async isDish(itemId) {
    const result = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM dish_products
        WHERE dish_item_id = $1
      )`,
      [itemId]
    );

    return result.rows[0].exists;
  }

  // Update dish products
  static async updateDishProducts(dishItemId, products) {
    // First, remove existing dish products
    await db.query(
      `DELETE FROM dish_products WHERE dish_item_id = $1`,
      [dishItemId]
    );

    console.log(`🗑️ Removed existing products from dish ${dishItemId}`);

    // Then add new products
    let totalPrice = 0;

    for (const product of products) {
      const { id, quantity } = product;

      // Update the product item
      const updatedProduct = await ItemModel.update(product.id, {
        quantity: quantity
      });

      // Link this product to the dish
      await db.query(
        `INSERT INTO dish_products (dish_item_id, product_item_id, quantity)
         VALUES ($1, $2, $3)`,
        [dishItemId, product.id, quantity]
      );

      totalPrice += updatedProduct.price * quantity;
    }

    // Update the dish item with the new total price
    await db.query(
      `UPDATE items
       SET price = $1
       WHERE id = $2`,
      [totalPrice, dishItemId]
    );

    console.log(`💰 Updated dish total price: ${totalPrice}`);

    return { success: true, totalPrice };
  }

  // Delete a dish and all its products
  static async deleteDish(dishItemId) {
    // Get all product items first
    const productsResult = await db.query(
      `SELECT product_item_id FROM dish_products WHERE dish_item_id = $1`,
      [dishItemId]
    );

    const productIds = productsResult.rows.map(row => row.product_item_id);

    // Delete the dish products relationships
    await db.query(
      `DELETE FROM dish_products WHERE dish_item_id = $1`,
      [dishItemId]
    );

    // Delete all product items
    for (const productId of productIds) {
      await ItemModel.delete(productId);
    }

    // Delete the main dish item
    await ItemModel.delete(dishItemId);

    return { success: true };
  }
}

module.exports = DishModel;