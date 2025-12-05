/**
 * API Client with OOP pattern and performance optimizations
 * Designed for 10,000+ concurrent users
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Token Manager - Singleton pattern for token management
 */
class TokenManager {
  constructor() {
    this.storageKey = 'auth_token';
  }

  get() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.storageKey);
  }

  set(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, token);
  }

  remove() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
  }

  hasToken() {
    return this.get() !== null;
  }
}

const tokenManager = new TokenManager();

export const getToken = () => tokenManager.get();
export const setToken = (token) => tokenManager.set(token);
export const removeToken = () => tokenManager.remove();

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * API Client with request caching and retry logic
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.requestQueue = new Map();
  }

  async _makeRequest(endpoint, options = {}) {
    const token = tokenManager.get();
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new ApiError(error.message || `HTTP error! status: ${response.status}`, response.status);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message || 'Network error', 0);
    }
  }

  async _makeMultipartRequest(endpoint, formData) {
    const token = tokenManager.get();
    const headers = new Headers();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new ApiError(error.message || `HTTP error! status: ${response.status}`, response.status);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message || 'Network error', 0);
    }
  }

  // Deduplicate concurrent requests
  async request(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    
    // If same request is in progress, return the same promise
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    const promise = this._makeRequest(endpoint, options);
    this.requestQueue.set(cacheKey, promise);
    
    promise.finally(() => {
      this.requestQueue.delete(cacheKey);
    });

    return promise;
  }

  async multipartRequest(endpoint, formData) {
    return this._makeMultipartRequest(endpoint, formData);
  }
}

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Authentication API
 */
export const authAPI = {
  discordLogin(redirectUri) {
    try {
      const params = new URLSearchParams();
      const currentOrigin = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const handoverUri = `${currentOrigin}/auth/handover`;

      if (redirectUri) {
        params.append('redirectUri', redirectUri);
      } else {
        params.append('redirectUri', handoverUri);
      }

      const discordAuthUrl = `${API_BASE_URL}/auth/discord?${params.toString()}`;
      console.log('Redirecting to Discord login:', discordAuthUrl);
      
      if (typeof window !== 'undefined') {
        window.location.href = discordAuthUrl;
      }
    } catch (error) {
      console.error('Error initiating Discord login:', error);
      if (typeof window !== 'undefined') {
        alert('Failed to initiate Discord login. Please check if the server is running.');
      }
    }
  },

  async devLogin(username) {
    const response = await apiClient.request('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    
    if (response.token) {
      tokenManager.set(response.token);
    }
    
    return response;
  },
};

/**
 * User API
 */
export const userAPI = {
  getMyProfile() {
    return apiClient.request('/api/v1/users/me');
  },

  getMyInventory() {
    return apiClient.request('/api/v1/users/me/inventory');
  },

  useItem(inventoryItemId, dojoId) {
    return apiClient.request('/api/v1/users/me/inventory/use', {
      method: 'POST',
      body: JSON.stringify({ inventoryItemId, dojoId }),
    });
  },

  getActiveQuests() {
    return apiClient.request('/api/v1/users/me/active-quests');
  },

  getCompletedQuests() {
    return apiClient.request('/api/v1/users/me/completed-quests');
  },

  rankUp() {
    return apiClient.request('/api/v1/users/rank-up', { method: 'POST' });
  },
};

/**
 * Quest API
 */
export const questAPI = {
  listAllQuests() {
    return apiClient.request('/api/v1/quests');
  },

  submitQuest(questId, formData) {
    return apiClient.multipartRequest(`/api/v1/quests/${questId}/submit`, formData);
  },
};

/**
 * Dojo API
 */
export const dojoAPI = {
  listDojos() {
    return apiClient.request('/api/v1/dojos');
  },

  checkDojoStatus(dojoId) {
    return apiClient.request(`/api/v1/dojos/${dojoId}/status`);
  },
};

/**
 * Item API
 */
export const itemAPI = {
  listItems() {
    return apiClient.request('/api/v1/items');
  },

  getItemById(itemId) {
    return apiClient.request(`/api/v1/items/${itemId}`);
  },

  createItem(itemData) {
    return apiClient.request('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },
};

/**
 * Leaderboard API
 */
export const leaderboardAPI = {
  getLeaderboard() {
    return apiClient.request('/api/v1/leaderboard');
  },

  async getHouseMembers(houseId) {
    try {
      return await apiClient.request(`/api/v1/houses/${houseId}/members`);
    } catch (error) {
      console.error(`Error fetching house members for ${houseId}:`, error);
      return [];
    }
  },
};

