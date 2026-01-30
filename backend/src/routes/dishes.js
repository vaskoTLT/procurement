const express = require('express');
const router = express.Router();
const DishModel = require('../models/DishModel');
const ItemModel = require('../models/ItemModel');

// Create a new dish
router.post('/', async (req, res) => {
  try {
    const { list_id, name, description = '', products = [] } = req.body;
    const userId = req.user.id;

    if (!list_id || !name || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: list_id, name, products'
      });
    }

    const dish = await DishModel.createDish(list_id, {
      name,
      description,
      products
    }, userId);

    res.json({ success: true, dish });
  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get dish details including products
router.get('/:dishId', async (req, res) => {
  try {
    const dishId = req.params.dishId;

    // Get the main dish item
    const dishItem = await ItemModel.findById(dishId);
    if (!dishItem) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }

    // Get the products for this dish
    const products = await DishModel.getDishProducts(dishId);

    res.json({
      success: true,
      dish: {
        ...dishItem,
        products
      }
    });
  } catch (error) {
    console.error('Error getting dish:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update dish products
router.put('/:dishId/products', async (req, res) => {
  try {
    const dishId = req.params.dishId;
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required'
      });
    }

    const result = await DishModel.updateDishProducts(dishId, products);

    // Get updated dish with products
    const updatedDish = await DishModel.getDishProducts(dishId);

    res.json({
      success: true,
      ...result,
      products: updatedDish
    });
  } catch (error) {
    console.error('Error updating dish products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a dish
router.delete('/:dishId', async (req, res) => {
  try {
    const dishId = req.params.dishId;

    await DishModel.deleteDish(dishId);

    res.json({ success: true, message: 'Dish deleted successfully' });
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if an item is a dish
router.get('/:dishId/check', async (req, res) => {
  try {
    const dishId = req.params.dishId;
    const isDish = await DishModel.isDish(dishId);

    res.json({ success: true, is_dish: isDish });
  } catch (error) {
    console.error('Error checking if item is dish:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;