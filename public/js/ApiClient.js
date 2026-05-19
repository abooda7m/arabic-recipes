'use strict';

/**
 * ApiClient — handles all HTTP communication with the backend.
 * Wraps fetch with consistent error handling and JSON parsing.
 */
class ApiClient {
  #baseURL;

  constructor(baseURL = '') {
    this.#baseURL = baseURL;
  }

  async #request(method, endpoint, body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };

    if (body !== null) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.#baseURL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ غير متوقع');
    }

    return data;
  }

  get(endpoint)         { return this.#request('GET',    endpoint);       }
  post(endpoint, body)  { return this.#request('POST',   endpoint, body); }
  put(endpoint, body)   { return this.#request('PUT',    endpoint, body); }
  delete(endpoint)      { return this.#request('DELETE', endpoint);       }
}
