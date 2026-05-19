'use strict';

/**
 * UIManager — handles all DOM rendering and UI interactions.
 * Listens to RecipeManager and AuthManager events via custom events.
 */
class UIManager {
  #recipeManager;
  #authManager;

  static COUNTRIES = [
    { name: 'الكل' },
    { name: 'السعودية' },
    { name: 'مصر' },
    { name: 'لبنان' },
    { name: 'المغرب' },
    { name: 'العراق' },
    { name: 'اليمن' },
    { name: 'سوريا' },
    { name: 'الأردن' },
    { name: 'تونس' },
    { name: 'الجزائر' },
    { name: 'فلسطين' },
    { name: 'الكويت' },
    { name: 'الإمارات' },
    { name: 'قطر' },
    { name: 'البحرين' },
    { name: 'عُمان' },
    { name: 'ليبيا' },
  ];

  static DEFAULT_IMG = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';

  constructor(recipeManager, authManager) {
    this.#recipeManager = recipeManager;
    this.#authManager   = authManager;
    this.#listenToManagers();
  }

  // ─── Manager Event Listeners ────────────────────────────
  #listenToManagers() {
    this.#recipeManager.addEventListener('recipesChange', (e) => {
      this.renderRecipes(e.detail.recipes);
      this.#syncCountryActive(e.detail.country);
    });

    this.#authManager.addEventListener('authChange', (e) => {
      this.#renderNav(e.detail.user);
    });
  }

  // ─── Navbar ─────────────────────────────────────────────
  #renderNav(user) {
    const authLinks = document.getElementById('auth-links');
    const userMenu  = document.getElementById('user-menu');
    const nameEl    = document.getElementById('username-display');

    if (!authLinks || !userMenu) return;

    if (user) {
      authLinks.classList.add('d-none');
      userMenu.classList.remove('d-none');
      if (nameEl) nameEl.textContent = user.username;
    } else {
      authLinks.classList.remove('d-none');
      userMenu.classList.add('d-none');
    }
  }

  // ─── Country Filter ──────────────────────────────────────
  renderCountryFilter(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = UIManager.COUNTRIES.map(
      (c) => `
        <div class="col-6 col-sm-4 col-md-3 col-lg-2 mb-3">
          <div class="country-card ${c.name === 'الكل' ? 'active' : ''}"
               data-country="${c.name}">
            <div class="country-name">${c.name}</div>
          </div>
        </div>`
    ).join('');

    container.addEventListener('click', (e) => {
      const card = e.target.closest('.country-card');
      if (!card) return;
      const country = card.dataset.country;
      this.showLoading();
      this.#recipeManager
        .fetchRecipes(country === 'الكل' ? null : country)
        .catch((err) => this.toast(err.message, 'error'))
        .finally(() => this.hideLoading());
    });
  }

  #syncCountryActive(country) {
    document.querySelectorAll('.country-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.country === country);
    });
  }

  // ─── Recipe Cards ────────────────────────────────────────
  renderRecipes(recipes) {
    const container = document.getElementById('recipes-container');
    if (!container) return;

    if (!recipes.length) {
      container.innerHTML = `
        <div class="col-12 empty-state">
          <div class="empty-icon"></div>
          <h4>لا توجد وصفات هنا</h4>
          <p>كن أول من يضيف وصفة من هذا البلد!</p>
        </div>`;
      return;
    }

    container.innerHTML = recipes.map((r) => this.#recipeCard(r)).join('');

    container.querySelectorAll('.recipe-card').forEach((card) => {
      card.addEventListener('click', () => {
        window.location.href = `/recipe-detail.html?id=${card.dataset.id}`;
      });
    });
  }

  #recipeCard(r) {
    const img   = r.image || UIManager.DEFAULT_IMG;
    const stars = this.#stars(r.avgRating);
    return `
      <div class="col-sm-6 col-lg-4 col-xl-3 mb-4">
        <div class="recipe-card" data-id="${r._id}">
          <div class="recipe-img-wrap">
            <img src="${img}" alt="${r.title}" class="recipe-img"
                 onerror="this.src='${UIManager.DEFAULT_IMG}'">
            <span class="recipe-badge">${r.country}</span>
          </div>
          <div class="recipe-body">
            <h3 class="recipe-title">${r.title}</h3>
            <div class="recipe-meta">
              <span>${r.cookTime ?? '?'} دقيقة</span>
              <span>${r.servings ?? 4} أشخاص</span>
            </div>
            <div class="recipe-footer">
              <span class="stars">${stars}</span>
              <span class="author">@${r.author?.username ?? 'مجهول'}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  #stars(avg = 0) {
    const full  = Math.round(avg);
    const empty = 5 - full;
    return '*'.repeat(full) + '-'.repeat(empty);
  }

  // ─── Recipe Detail ───────────────────────────────────────
  renderRecipeDetail(recipe) {
    const container = document.getElementById('detail-container');
    if (!container) return;

    const img = recipe.image || UIManager.DEFAULT_IMG;

    container.innerHTML = `
      <div class="row g-4 mb-5">
        <div class="col-lg-6">
          <img src="${img}" alt="${recipe.title}" class="detail-img"
               onerror="this.src='${UIManager.DEFAULT_IMG}'">
        </div>
        <div class="col-lg-6 d-flex flex-column justify-content-center">
          <span class="badge mb-3" style="background:var(--primary);font-family:Cairo,sans-serif;font-size:.9rem;padding:6px 16px;border-radius:20px;width:fit-content">
            ${recipe.country}
          </span>
          <h1 style="font-size:2.4rem;font-weight:900;line-height:1.2">${recipe.title}</h1>
          <p style="color:var(--muted);margin:1rem 0 1.5rem;line-height:1.8">${recipe.description}</p>

          <div class="d-flex gap-3 mb-4">
            <div class="info-box"><div class="val">${recipe.cookTime ?? '?'}</div><div class="lbl">دقيقة</div></div>
            <div class="info-box"><div class="val">${recipe.servings ?? 4}</div><div class="lbl">أشخاص</div></div>
            <div class="info-box" id="rating-box">
              <div class="val">*</div>
              <div class="val" id="avg-display">${recipe.avgRating || 0}</div>
              <div class="lbl">(${recipe.ratings?.length ?? 0} تقييم)</div>
            </div>
          </div>

          <div id="star-rating-section"></div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <h2 class="section-title">المكونات</h2>
          ${recipe.ingredients.map((i) => `
            <div class="ingredient-row">
              <span class="name">${i.name}</span>
              <span class="amount">${i.amount}</span>
            </div>`).join('')}
        </div>
        <div class="col-lg-8">
          <h2 class="section-title">طريقة التحضير</h2>
          ${recipe.steps.map((s, idx) => `
            <div class="step-row">
              <div class="step-num">${idx + 1}</div>
              <p style="margin:0;line-height:1.75">${s}</p>
            </div>`).join('')}
        </div>
      </div>`;

    this.#renderStarRating(recipe._id);
  }

  #renderStarRating(recipeId) {
    const section = document.getElementById('star-rating-section');
    if (!section) return;

    if (!this.#authManager.isLoggedIn) {
      section.innerHTML = `<a href="/login.html" style="color:var(--primary);font-weight:600">سجل الدخول لتقييم الوصفة →</a>`;
      return;
    }

    section.innerHTML = `
      <p style="font-weight:700;margin-bottom:.6rem">قيّم هذه الوصفة:</p>
      <div class="d-flex gap-2" id="star-btns">
        ${[1,2,3,4,5].map((v) => `
          <button class="star-btn" data-value="${v}">*</button>`).join('')}
      </div>`;

    section.querySelectorAll('.star-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await this.#recipeManager.rate(recipeId, +btn.dataset.value);
          const avg = document.getElementById('avg-display');
          if (avg) avg.textContent = res.avgRating;
          this.toast(`شكراً! معدل التقييم الآن: ${res.avgRating}`, 'success');
          section.querySelectorAll('.star-btn').forEach((b, i) => {
            b.classList.toggle('active', i < +btn.dataset.value);
          });
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    });
  }

  // ─── Loading ─────────────────────────────────────────────
  showLoading() {
    document.getElementById('loading-overlay')?.classList.add('show');
  }
  hideLoading() {
    document.getElementById('loading-overlay')?.classList.remove('show');
  }

  // ─── Toast ───────────────────────────────────────────────
  toast(message, type = 'info') {
    let wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }

    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    el.textContent = message;
    wrap.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'toastOut .3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }
}
