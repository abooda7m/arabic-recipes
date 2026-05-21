const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/auth');
const https = require('https');

const router = express.Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

// Curated fallback food photos by category (Unsplash static IDs, always food)
const FALLBACK_IMAGES = {
  'مقبلات':        'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800&q=80',
  'أطباق رئيسية': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'حلويات':        'https://images.unsplash.com/photo-1618426703623-c1b335a8b61f?w=800&q=80',
  'مشروبات':       'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
  'شوربات':        'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'سلطات':         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
};

function httpGet(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
  });
}

async function fetchRecipeImage(englishName, category) {
  // Try progressively shorter search terms (e.g. "Beef Mandi Rice" → "Beef Mandi" → "Mandi")
  const words = englishName.trim().split(/\s+/);
  const candidates = [];
  for (let len = words.length; len >= 1; len--) {
    candidates.push(words.slice(0, len).join(' '));
  }

  for (const term of candidates) {
    const raw = await httpGet(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`
    );
    if (raw) {
      try {
        const json = JSON.parse(raw);
        if (json.meals?.[0]?.strMealThumb) {
          console.log(`TheMealDB match: "${term}" → ${json.meals[0].strMealThumb}`);
          return json.meals[0].strMealThumb;
        }
      } catch { /* fall through */ }
    }
  }

  // Fallback: curated food photo based on category
  return FALLBACK_IMAGES[category] || FALLBACK_IMAGES['أطباق رئيسية'];
}

// POST /api/ai/generate-recipe
router.post('/generate-recipe', protect, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'prompt مطلوب' });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: 'أنت طاهٍ عربي محترف متخصص في الوصفات العربية الأصيلة. مهمتك الوحيدة هي إنتاج بيانات JSON للوصفات. لا تتكلم أبداً، فقط أعد JSON.',
      messages: [
        {
          role: 'user',
          content: `الطلب: ${prompt}

أعد JSON فقط بهذا الهيكل بالضبط (كل النصوص بالعربية ماعدا englishName):
{
  "title": "اسم الوصفة بالعربية",
  "description": "وصف شهي للوصفة بالعربية",
  "country": "الدولة الأصلية للوصفة (مثال: اليمن، لبنان، مصر...)",
  "category": "تصنيف الوصفة (اختر من: مقبلات، أطباق رئيسية، حلويات، مشروبات، شوربات، سلطات)",
  "cookTime": 30,
  "servings": 4,
  "ingredients": [
    {"name": "المكون بالعربية", "amount": "الكمية بالعربية"}
  ],
  "steps": ["الخطوة الأولى بالعربية", "الخطوة الثانية بالعربية"],
  "englishName": "English name of the dish for image search"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('غير متوقع: الرد ليس نصاً');
    }

    // Extract JSON from response
    let jsonText = content.text.trim();
    console.log('Claude response:', jsonText.substring(0, 200));

    // Try multiple extraction methods
    // 1. Markdown code blocks
    let jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    } else {
      // 2. Find JSON object (handles cases where { ... } might be in text)
      const startIdx = jsonText.indexOf('{');
      const endIdx = jsonText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonText = jsonText.substring(startIdx, endIdx + 1);
      }
    }

    console.log('Extracted JSON:', jsonText.substring(0, 150));

    let recipeData = JSON.parse(jsonText);

    const englishName = recipeData.englishName || recipeData.title;
    const category = recipeData.category || 'أطباق رئيسية';
    delete recipeData.englishName;

    recipeData.author = req.user._id;

    console.log(`Fetching image for: ${englishName}`);
    recipeData.image = await fetchRecipeImage(englishName, category);
    console.log(`Image URL: ${recipeData.image}`);

    const recipe = await Recipe.create(recipeData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الوصفة بنجاح مع صورة',
      data: recipe,
    });
  } catch (err) {
    console.error('AI Recipe Error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'خطأ في إنشاء الوصفة',
    });
  }
});

module.exports = router;
