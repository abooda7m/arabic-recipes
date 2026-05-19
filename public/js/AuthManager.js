'use strict';

/**
 * AuthManager — manages user authentication state.
 * Emits 'authChange' custom event when auth state changes.
 */
class AuthManager extends EventTarget {
  #apiClient;
  #currentUser;

  constructor(apiClient) {
    super();
    this.#apiClient = apiClient;
    this.#currentUser = null;
  }

  get currentUser()  { return this.#currentUser; }
  get isLoggedIn()   { return this.#currentUser !== null; }

  async checkAuth() {
    try {
      const res = await this.#apiClient.get('/api/auth/me');
      this.#currentUser = res.user;
    } catch {
      this.#currentUser = null;
    }
    this.#emit();
    return this.isLoggedIn;
  }

  async register(username, email, password) {
    const res = await this.#apiClient.post('/api/auth/register', { username, email, password });
    this.#currentUser = res.user;
    this.#emit();
    return res;
  }

  async login(email, password) {
    const res = await this.#apiClient.post('/api/auth/login', { email, password });
    this.#currentUser = res.user;
    this.#emit();
    return res;
  }

  async logout() {
    await this.#apiClient.post('/api/auth/logout', {});
    this.#currentUser = null;
    this.#emit();
  }

  #emit() {
    this.dispatchEvent(
      new CustomEvent('authChange', {
        detail: { user: this.#currentUser, isLoggedIn: this.isLoggedIn },
      })
    );
  }
}
