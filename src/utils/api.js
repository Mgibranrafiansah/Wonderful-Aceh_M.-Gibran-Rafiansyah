let memoryToken = null;

export function getAuthToken() {
  return memoryToken;
}

export function setAuthToken(token) {
  memoryToken = token || null;
}

export function clearAuthToken() {
  memoryToken = null;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (memoryToken) {
    headers.Authorization = `Bearer ${memoryToken}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || `Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return data;
}

export const api = {
  getAuthStatus: () => request('/api/auth/status'),
  claimAdmin: (payload) =>
    request('/api/auth/claim-admin', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/api/auth/me'),

  getCatalog: () => request('/api/catalog'),
  createCatalogItem: (type, item) =>
    request(`/api/catalog/${encodeURIComponent(type)}`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  updateCatalogItem: (type, id, item) =>
    request(`/api/catalog/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  deleteCatalogItem: (type, id) =>
    request(`/api/catalog/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  resetCatalog: () => request('/api/catalog/reset', { method: 'POST' }),

  getUserWorkspace: () => request('/api/user/workspace'),
  saveFavorites: (favorites) =>
    request('/api/user/favorites', {
      method: 'PUT',
      body: JSON.stringify({ favorites }),
    }),
  saveItineraries: (itineraries) =>
    request('/api/user/itineraries', {
      method: 'PUT',
      body: JSON.stringify({ itineraries }),
    }),

  listUsers: () => request('/api/admin/users'),
  createManagedUser: (payload) =>
    request('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUserRole: (id, role) =>
    request(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  deleteManagedUser: (id) =>
    request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  identifyLandmarkPhoto: (payload) =>
    request('/api/identify-landmark', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
