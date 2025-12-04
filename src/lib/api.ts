const API_BASE_URL = 'https://api.questcity.cloud/hamster-world';

// Token management
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

// Custom API Error class
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(error.message || `HTTP error! status: ${response.status}`, response.status);
  }

  return response.json();
}

// Helper function for multipart/form-data requests
async function apiCallMultipart<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const headers = new Headers();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(error.message || `HTTP error! status: ${response.status}`, response.status);
  }

  return response.json();
}

// Authentication APIs
export const authAPI = {
  // Discord login - redirects to Discord
  discordLogin: (redirectUri?: string) => {
    try {
      const params = new URLSearchParams();
      // The redirectUri should point to the handover endpoint where the token will be received
      // Format: {currentOrigin}{basePath}/auth/handover
      const currentOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      // Get basePath from environment variable or detect from current path
      // In development, basePath is typically empty; in production it's /hamster-quest
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ||
        (window.location.pathname.startsWith('/hamster-quest') ? '/hamster-quest' : '');
      const handoverUri = `${currentOrigin}${basePath}/auth/handover`;

      if (redirectUri) {
        params.append('redirectUri', redirectUri);
      } else {
        // Default to handover endpoint if no redirectUri provided
        params.append('redirectUri', handoverUri);
      }

      const discordAuthUrl = `${API_BASE_URL}/auth/discord?${params.toString()}`;
      console.log('Redirecting to Discord login:', discordAuthUrl);
      console.log('Handover URI:', handoverUri);
      window.location.href = discordAuthUrl;
    } catch (error) {
      console.error('Error initiating Discord login:', error);
      alert('Failed to initiate Discord login. Please check if the server is running.');
    }
  },

  // Developer login (for testing)
  devLogin: async (username: string) => {
    const response = await apiCall<{ token: string; user: any }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },
};

// User APIs
export const userAPI = {
  // Get my profile
  getMyProfile: () => apiCall<any>('/api/v1/users/me'),

  // Get my inventory
  getMyInventory: () => apiCall<any[]>('/api/v1/users/me/inventory'),

  // Use item
  useItem: (inventoryItemId: string, dojoId?: string) =>
    apiCall('/api/v1/users/me/inventory/use', {
      method: 'POST',
      body: JSON.stringify({ inventoryItemId, dojoId }),
    }),

  // Get active quests
  getActiveQuests: () => apiCall<any[]>('/api/v1/users/me/active-quests'),

  // Get completed quests
  getCompletedQuests: () => apiCall<any[]>('/api/v1/users/me/completed-quests'),

  // Rank up
  rankUp: () => apiCall('/api/v1/users/rank-up', { method: 'POST' }),
};

// Quest APIs
export const questAPI = {
  // List all quests
  listAllQuests: () => apiCall<any[]>('/api/v1/quests'),

  // Submit quest
  submitQuest: (questId: string, formData: FormData) =>
    apiCallMultipart(`/api/v1/quests/${questId}/submit`, formData),
};

// Dojo APIs
export const dojoAPI = {
  // List dojos
  listDojos: () => apiCall<any[]>('/api/v1/dojos'),

  // Check dojo status
  checkDojoStatus: (dojoId: string) => apiCall(`/api/v1/dojos/${dojoId}/status`),
};

// Item APIs
export const itemAPI = {
  // List items
  listItems: () => apiCall<{ message: string; data: any[] }>('/api/v1/items'),

  // Get item by ID
  getItemById: (itemId: string) => apiCall<{ message: string; data: any }>(`/api/v1/items/${itemId}`),

  // Create item (public - should be careful in production)
  createItem: (itemData: any) =>
    apiCall('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
};

// Leaderboard APIs
export const leaderboardAPI = {
  // Get leaderboard (returns both users and houses)
  getLeaderboard: () => apiCall<{ users: any[]; houses?: any[] }>('/api/v1/leaderboard'),

  // Get house members (if endpoint exists)
  getHouseMembers: (houseId: string) => apiCall<any[]>(`/api/v1/houses/${houseId}/members`).catch(() => []),
};

