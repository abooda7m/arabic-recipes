const mongoose = require('mongoose');

const COUNTRIES = [
  'السعودية', 'مصر', 'لبنان', 'المغرب', 'العراق',
  'اليمن', 'سوريا', 'الأردن', 'تونس', 'الجزائر',
  'فلسطين', 'الكويت', 'الإمارات', 'البحرين', 'قطر', 'عُمان', 'ليبيا',
];

const CATEGORIES = ['مقبلات', 'أطباق رئيسية', 'حلويات', 'مشروبات', 'شوربات', 'سلطات'];

const ingredientSchema = new mongoose.Schema(
  { name: { type: String, required: true }, amount: { type: String, required: true } },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, value: { type: Number, min: 1, max: 5 } },
  { _id: false }
);

const recipeSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'اسم الوصفة مطلوب'], trim: true },
  description: { type: String, required: [true, 'وصف الوصفة مطلوب'] },
  country:     { type: String, required: [true, 'البلد مطلوب'], enum: COUNTRIES },
  category:    { type: String, enum: CATEGORIES, default: 'أطباق رئيسية' },
  ingredients: [ingredientSchema],
  steps:       [String],
  cookTime:    { type: Number, default: 30 },
  servings:    { type: Number, default: 4 },
  image:       { type: String, default: '' },
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings:     [ratingSchema],
  avgRating:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

recipeSchema.methods.recalcAvgRating = function () {
  if (!this.ratings.length) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
};

module.exports = mongoose.model('Recipe', recipeSchema);
