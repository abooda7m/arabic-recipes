const express = require('express');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/recipes ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};

    if (req.query.country && req.query.country !== 'الكل') {
      filter.country = req.query.country;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const recipes = await Recipe.find(filter)
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: recipes.length, data: recipes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/recipes/countries ───────────────────────────
router.get('/countries', async (req, res) => {
  try {
    const countries = await Recipe.distinct('country');
    res.json({ success: true, data: countries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/recipes/:id ──────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('author', 'username');
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'الوصفة غير موجودة' });
    }
    res.json({ success: true, data: recipe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/recipes ─────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const recipe = await Recipe.create({ ...req.body, author: req.user._id });
    res.status(201).json({ success: true, data: recipe });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── POST /api/recipes/:id/rate ────────────────────────────
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'التقييم يجب أن يكون بين 1 و 5' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'الوصفة غير موجودة' });
    }

    const existingIdx = recipe.ratings.findIndex(
      (r) => r.user?.toString() === req.user._id.toString()
    );

    if (existingIdx > -1) {
      recipe.ratings[existingIdx].value = rating;
    } else {
      recipe.ratings.push({ user: req.user._id, value: rating });
    }

    recipe.avgRating = recipe.recalcAvgRating();
    await recipe.save();

    res.json({
      success: true,
      avgRating: recipe.avgRating,
      totalRatings: recipe.ratings.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
