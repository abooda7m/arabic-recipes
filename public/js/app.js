'use strict';

// ─── Shared Instances (module-level constants only) ────────
const apiClient     = new ApiClient();
const authManager   = new AuthManager(apiClient);
const recipeManager = new RecipeManager(apiClient);
const ui            = new UIManager(recipeManager, authManager);

// ─── Bootstrap ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  ui.showLoading();

  try {
    await authManager.checkAuth();
  } catch {
    // no-op: checkAuth never throws, just sets user to null
  }

  const path = window.location.pathname.replace(/\/$/, '') || '/index.html';

  try {
    if (path === '' || path === '/index.html' || path === '/') {
      await initHome();
    } else if (path === '/recipes.html') {
      await initRecipes();
    } else if (path === '/recipe-detail.html') {
      await initDetail();
    } else if (path === '/login.html') {
      initLogin();
    } else if (path === '/register.html') {
      initRegister();
    } else if (path === '/add-recipe.html') {
      initAddRecipe();
    }
  } catch (err) {
    ui.toast(err.message, 'error');
  } finally {
    ui.hideLoading();
  }

  // Global logout button
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await authManager.logout();
    window.location.href = '/';
  });
});

// ─── Home Page ────────────────────────────────────────────
async function initHome() {
  ui.renderCountryFilter('country-filter-container');
  await recipeManager.fetchRecipes();
  updateHeroStats();
}

function updateHeroStats() {
  const countEl = document.getElementById('recipe-count');
  if (countEl) countEl.textContent = recipeManager.recipes.length + '+';
}

// ─── Recipes Page ─────────────────────────────────────────
async function initRecipes() {
  ui.renderCountryFilter('country-filter-container');
  await recipeManager.fetchRecipes();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const country = recipeManager.activeCountry !== 'الكل' ? recipeManager.activeCountry : null;
        recipeManager.fetchRecipes(country, searchInput.value.trim() || null)
          .catch((err) => ui.toast(err.message, 'error'));
      }, 450);
    });
  }
}

// ─── Recipe Detail Page ───────────────────────────────────
async function initDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = '/recipes.html'; return; }

  try {
    const recipe = await recipeManager.fetchOne(id);
    ui.renderRecipeDetail(recipe);
    document.title = `${recipe.title} | وصفاتي العربية`;
  } catch {
    ui.toast('الوصفة غير موجودة', 'error');
    setTimeout(() => (window.location.href = '/recipes.html'), 1800);
  }
}

// ─── Login Page ───────────────────────────────────────────
function initLogin() {
  if (authManager.isLoggedIn) { window.location.href = '/'; return; }

  const form   = document.getElementById('login-form');
  const errEl  = document.getElementById('error-msg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl?.classList.add('d-none');

    try {
      await authManager.login(
        document.getElementById('email').value,
        document.getElementById('password').value
      );
      window.location.href = '/';
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.classList.remove('d-none'); }
    }
  });
}

// ─── Register Page ────────────────────────────────────────
function initRegister() {
  if (authManager.isLoggedIn) { window.location.href = '/'; return; }

  const form  = document.getElementById('register-form');
  const errEl = document.getElementById('error-msg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl?.classList.add('d-none');

    const pass    = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (pass !== confirm) {
      if (errEl) { errEl.textContent = 'كلمتا المرور غير متطابقتين'; errEl.classList.remove('d-none'); }
      return;
    }

    try {
      await authManager.register(
        document.getElementById('username').value,
        document.getElementById('email').value,
        pass
      );
      window.location.href = '/';
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.classList.remove('d-none'); }
    }
  });
}

// ─── Add Recipe Page ──────────────────────────────────────
function initAddRecipe() {
  if (!authManager.isLoggedIn) { window.location.href = '/login.html'; return; }

  // Dynamic ingredient rows
  const ingContainer = document.getElementById('ingredients-container');
  document.getElementById('add-ingredient')?.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'd-flex gap-2 mb-2';
    row.innerHTML = `
      <input type="text"  class="form-control ing-name"   placeholder="اسم المكون">
      <input type="text"  class="form-control ing-amount" placeholder="الكمية">
      <button type="button" class="btn btn-outline-danger remove-row px-3">x</button>`;
    row.querySelector('.remove-row').addEventListener('click', () => row.remove());
    ingContainer?.appendChild(row);
  });

  // Dynamic step rows
  const stepsContainer = document.getElementById('steps-container');
  let stepCount = document.querySelectorAll('.step-text').length || 1;

  document.getElementById('add-step')?.addEventListener('click', () => {
    stepCount++;
    const row = document.createElement('div');
    row.className = 'd-flex gap-2 mb-2 align-items-start';
    row.innerHTML = `
      <div class="step-num flex-shrink-0 mt-1">${stepCount}</div>
      <textarea class="form-control step-text" rows="2" placeholder="الخطوة ${stepCount}"></textarea>
      <button type="button" class="btn btn-outline-danger remove-row px-3 mt-1">x</button>`;
    row.querySelector('.remove-row').addEventListener('click', () => row.remove());
    stepsContainer?.appendChild(row);
  });

  // Form submit
  const form  = document.getElementById('add-recipe-form');
  const errEl = document.getElementById('error-msg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl?.classList.add('d-none');

    const ingredients = [];
    document.querySelectorAll('#ingredients-container .d-flex').forEach((row) => {
      const name   = row.querySelector('.ing-name')?.value?.trim();
      const amount = row.querySelector('.ing-amount')?.value?.trim();
      if (name && amount) ingredients.push({ name, amount });
    });

    const steps = [...document.querySelectorAll('.step-text')]
      .map((el) => el.value.trim())
      .filter(Boolean);

    const payload = {
      title:       document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      country:     document.getElementById('country').value,
      category:    document.getElementById('category').value,
      cookTime:    parseInt(document.getElementById('cookTime').value) || 30,
      servings:    parseInt(document.getElementById('servings').value) || 4,
      image:       document.getElementById('image').value.trim(),
      ingredients,
      steps,
    };

    try {
      await recipeManager.create(payload);
      ui.toast('تمت إضافة الوصفة بنجاح!', 'success');
      setTimeout(() => (window.location.href = '/recipes.html'), 1500);
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.classList.remove('d-none'); }
    }
  });
}
