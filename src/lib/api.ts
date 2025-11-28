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
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
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
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Authentication APIs
export const authAPI = {
  // Discord login - redirects to Discord
  discordLogin: (redirectUri?: string) => {
    const params = new URLSearchParams();
    if (redirectUri) {
      params.append('redirectUri', redirectUri);
    }
    window.location.href = `${API_BASE_URL}/auth/discord?${params.toString()}`;
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

  // Create item (public - should be careful in production)
  createItem: (itemData: any) =>
    apiCall('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
};

// Leaderboard APIs
export const leaderboardAPI = {
  // Get leaderboard
  getLeaderboard: () => apiCall<any[]>('/api/v1/leaderboard'),
};

// Admin APIs
export const adminAPI = {
  // Create quest
  createQuest: (formData: FormData) =>
    apiCallMultipart('/api/v1/admin/quests', formData),

  // Assign quest to user
  assignQuestToUser: (userId: string, questId: string) =>
    apiCall(`/api/v1/admin/users/${userId}/quests`, {
      method: 'POST',
      body: JSON.stringify({ questId }),
    }),

  // Get submissions
  getSubmissions: () => apiCall<any[]>('/api/v1/admin/submissions'),

  // Approve submission
  approveSubmission: (submissionId: string) =>
    apiCall(`/api/v1/admin/submissions/${submissionId}/approve`, {
      method: 'PUT',
    }),

  // Reject submission
  rejectSubmission: (submissionId: string, feedback: string) =>
    apiCall(`/api/v1/admin/submissions/${submissionId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ feedback }),
    }),

  // Grant item to user
  grantItem: (userId: string, itemId: string, quantity: number) =>
    apiCall(`/api/v1/admin/users/${userId}/grant-item`, {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity }),
    }),

  // House management
  getHouses: () => apiCall('/api/v1/admin/houses'),
  createHouse: (name: string, discordRoleId: string) =>
    apiCall('/api/v1/admin/houses', {
      method: 'POST',
      body: JSON.stringify({ name, discordRoleId }),
    }),
  updateHouse: (houseId: string, data: any) =>
    apiCall(`/api/v1/admin/houses/${houseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteHouse: (houseId: string) =>
    apiCall(`/api/v1/admin/houses/${houseId}`, {
      method: 'DELETE',
    }),
};

