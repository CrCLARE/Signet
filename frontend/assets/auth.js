 /**
 * Signet - Frontend API wrapper
 *
 * Two isolated namespaces:
 *   AuthAPI  → localStorage.cs_auth_token    (end user)
 *   AdminAPI → localStorage.cs_admin_token   (administrator)
 *
 * The base URL is read from window.SIGNET_CONFIG.apiBase if present,
 * otherwise falls back to the default. This allows self-hosters to
 * override the endpoint without editing this file.
 */

(function (global) {
  'use strict';

  // ============================================================
  // Configuration
  // ============================================================

  const CONFIG = global.SIGNET_CONFIG || {};
  const API_BASE = CONFIG.apiBase || 'https://api.example.com';

  const TOKEN_KEY       = 'cs_auth_token';
  const USER_KEY        = 'cs_auth_user';
  const ADMIN_TOKEN_KEY = 'cs_admin_token';

  // ============================================================
  // User session helpers
  // ============================================================

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ============================================================
  // User request wrapper
  // ============================================================

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(API_BASE + path, { ...options, headers });
    } catch (e) {
      throw new Error('Unable to reach the server');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  // ============================================================
  // AuthAPI
  // ============================================================

  const AuthAPI = {
    getToken,
    getUser,
    setSession,
    clearSession,

    // ---------- authentication ----------
    async register({ email, nickname, password }) {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, nickname, password })
      });
      setSession(data.token, data.user);
      return data;
    },

    async login({ email, password }) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setSession(data.token, data.user);
      return data;
    },

    logout() {
      clearSession();
    },

    requireAuth() {
      if (!getToken()) {
        location.href = '/login.html';
        return false;
      }
      return true;
    },

    // ---------- adapters ----------
    async listAdapters() {
      const data = await request('/api/adapters');
      return data.adapters || [];
    },

    // ---------- license binding ----------
    async getLicenseStatus() {
      return request('/api/license/status');
    },

    async bindOrder(orderNo, provider) {
      return request('/api/license/bind', {
        method: 'POST',
        body: JSON.stringify({ order_no: orderNo, provider })
      });
    },

    // ---------- products ----------
    async listProducts() {
      return request('/api/products');
    },

    async createProduct(name) {
      return request('/api/products', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    },

    async updateProduct(productId, name) {
      return request('/api/products/' + productId, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
    },

    async deleteProduct(productId) {
      return request('/api/products/' + productId, {
        method: 'DELETE'
      });
    },

    async generateLicense(productId) {
      return request('/api/products/' + productId + '/license', {
        method: 'POST'
      });
    }
  };

  // ============================================================
  // Admin session helpers
  // ============================================================

  function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  function setAdminToken(t) {
    localStorage.setItem(ADMIN_TOKEN_KEY, t);
  }

  function clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  // ============================================================
  // Admin request wrapper
  // ============================================================

  async function adminRequest(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const token = getAdminToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(API_BASE + path, { ...options, headers });
    } catch (e) {
      throw new Error('Unable to reach the server');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (res.status === 401) {
      clearAdminToken();
      throw new Error(data.error || 'Session expired');
    }

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  // ============================================================
  // AdminAPI
  // ============================================================

  const AdminAPI = {
    getToken: getAdminToken,
    setToken: setAdminToken,
    clearToken: clearAdminToken,

    // ---------- authentication ----------
    async login(username, password) {
      const data = await adminRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setAdminToken(data.token);
      return data;
    },

    logout() {
      clearAdminToken();
    },

    isAuthenticated() {
      return !!getAdminToken();
    },

    // ---------- stats ----------
    stats() {
      return adminRequest('/api/admin/stats');
    },

    // ---------- licenses ----------
    listLicenses(params) {
      const qs = params instanceof URLSearchParams
        ? params.toString()
        : String(params || '');
      return adminRequest('/api/admin/licenses' + (qs ? '?' + qs : ''));
    },

    ban(body) {
      return adminRequest('/api/admin/ban', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },

    unban(body) {
      return adminRequest('/api/admin/unban', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },

    updateLicense(licenseId, body) {
      return adminRequest('/api/admin/licenses/' + licenseId, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
    },

    // ---------- users ----------
    listUsers(q) {
      return adminRequest(
        '/api/admin/users' + (q ? '?q=' + encodeURIComponent(q) : '')
      );
    },

    resetPassword(body) {
      return adminRequest('/api/admin/users/reset-password', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },

    // ---------- grants ----------
    grantPro(body) {
      return adminRequest('/api/admin/grant', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },

    // ---------- audit ----------
    audit() {
      return adminRequest('/api/admin/audit');
    }
  };

  // ============================================================
  // Expose
  // ============================================================

  global.AuthAPI = AuthAPI;
  global.AdminAPI = AdminAPI;
})(window);
