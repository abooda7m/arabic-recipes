'use strict';

/**
 * RecipeManager — manages recipe data and filtering.
 * Emits 'recipesChange' custom event when data updates.
 */
class RecipeManager extends EventTarget {
  #apiClient;
  #recipes;
  #activeCountry;

  constructor(apiClient) {
    super();
    this.#apiClient = apiClient;
    this.#recipes = [];
    this.#activeCountry = 'الكل';
  }

  get recipes()       { return [...this.#recipes]; }
  get activeCountry() { return this.#activeCountry; }

  async fetchRecipes(country = null, search = null) {
    this.#activeCountry = country || 'الكل';

    const params = new URLSearchParams();
    if (country && country !== 'الكل') params.set('country', country);
    if (search)                          params.set('search', search);

    const qs = params.toString();
    const res = await this.#apiClient.get(`/api/recipes${qs ? '?' + qs : ''}`);

    this.#recipes = res.data;
    this.#emit();
    return this.#recipes;
  }

  async fetchOne(id) {
    const res = await this.#apiClient.get(`/api/recipes/${id}`);
    return res.data;
  }

  async create(recipeData) {
    const res = await this.#apiClient.post('/api/recipes', recipeData);
    this.#recipes.unshift(res.data);
    this.#emit();
    return res.data;
  }

  async rate(id, rating) {
    const res = await this.#apiClient.post(`/api/recipes/${id}/rate`, { rating });
    const idx = this.#recipes.findIndex((r) => r._id === id);
    if (idx > -1) this.#recipes[idx].avgRating = res.avgRating;
    return res;
  }

  async generateWithAI(prompt) {
    const res = await this.#apiClient.post('/api/ai/generate-recipe', { prompt });
    this.#recipes.unshift(res.data);
    this.#emit();
    return res.data;
  }

  #emit() {
    this.dispatchEvent(
      new CustomEvent('recipesChange', {
        detail: { recipes: this.#recipes, country: this.#activeCountry },
      })
    );
  }
}
