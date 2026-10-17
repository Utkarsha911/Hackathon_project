/**
 * Comprehensive API client for the BIC Hackathon Platform.
 * Communicates with the FastAPI backend (http://localhost:8000/api/v1).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1';

export const BACKEND_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken() {
  return localStorage.getItem('bic_auth_token');
}

export function setAuthToken(token) {
  if (token) {
    const cleanToken =
      typeof token === 'string' && token.startsWith('Bearer ')
        ? token.slice(7).trim()
        : token;
    localStorage.setItem('bic_auth_token', cleanToken);
  } else {
    localStorage.removeItem('bic_auth_token');
  }
}

export function clearAuthToken() {
  localStorage.removeItem('bic_auth_token');
}

export function getRefreshToken() {
  return localStorage.getItem('bic_refresh_token');
}

export function setRefreshToken(token) {
  if (token) {
    const cleanToken =
      typeof token === 'string' && token.startsWith('Bearer ')
        ? token.slice(7).trim()
        : token;
    localStorage.setItem('bic_refresh_token', cleanToken);
  } else {
    localStorage.removeItem('bic_refresh_token');
  }
}

export function clearRefreshToken() {
  localStorage.removeItem('bic_refresh_token');
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem('bic_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminUser(user) {
  if (user) {
    localStorage.setItem('bic_admin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('bic_admin_user');
  }
}

export function clearAdminUser() {
  localStorage.removeItem('bic_admin_user');
}

export function logout() {
  clearAuthToken();
  clearRefreshToken();
  clearAdminUser();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bic_auth_logout'));
  }
}

export function isAdminAuthenticated() {
  return Boolean(getAuthToken() || getAdminUser());
}

/**
 * Concurrency-safe token refresh mechanism
 */
let refreshPromise = null;

export async function refreshAccessToken() {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    logout();
    const error = new Error('Session expired. Please log in again.');
    error.status = 401;
    throw error;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: currentRefreshToken }),
    });

    if (!response.ok) {
      let errDetail = response.statusText;
      try {
        const errJson = await response.json();
        errDetail = errJson.detail || errJson.message || errDetail;
      } catch {
        // ignore json parse error
      }
      logout();
      const err = new Error(errDetail || 'Session expired. Please log in again.');
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const newAccessToken =
      data?.access ||
      data?.token ||
      data?.access_token ||
      data?.data?.access;
    const newRefreshToken =
      data?.refresh ||
      data?.refresh_token ||
      data?.data?.refresh;

    if (!newAccessToken) {
      logout();
      throw new Error('No access token returned from refresh endpoint');
    }

    setAuthToken(newAccessToken);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }

    return newAccessToken;
  } catch (err) {
    logout();
    throw err;
  } finally {
    refreshPromise = null;
  }
}

function getOrStartTokenRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken();
  }
  return refreshPromise;
}

/**
 * Core HTTP Request Wrapper with automatic token refresh and auto-logout
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = options.token || getAuthToken();

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach Bearer token if available and not explicitly overridden
  if (token && !headers['Authorization']) {
    const bearer = typeof token === 'string' && token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    headers['Authorization'] = bearer;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorJson = null;
    try {
      errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // ignore json parse error
    }

    // Detect SimpleJWT expired token or invalid token responses:
    // {
    //   "detail": "Given token not valid for any token type",
    //   "code": "token_not_valid",
    //   "messages": [{ "token_class": "AccessToken", "token_type": "access", "message": "Token is expired" }]
    // }
    const isTokenNotValid =
      (response.status === 401 || response.status === 403) &&
      (
        errorJson?.code === 'token_not_valid' ||
        errorJson?.detail === 'Given token not valid for any token type' ||
        (Array.isArray(errorJson?.messages) &&
          errorJson.messages.some((m) => m?.message === 'Token is expired')) ||
        (typeof errorDetail === 'string' &&
          (errorDetail.toLowerCase().includes('token is expired') ||
           errorDetail.toLowerCase().includes('token_not_valid') ||
           errorDetail.toLowerCase().includes('given token not valid')))
      );

    const isAuthEndpoint =
      endpoint.includes('/users/token/refresh') ||
      endpoint.includes('/users/login') ||
      endpoint.includes('/auth/login');

    // If token expired and this is not already a retry or refresh call, attempt refresh
    if ((isTokenNotValid || response.status === 401) && !options._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token available to renew session -> auto logout immediately
        logout();
        const error = new Error('Session expired. Please log in again.');
        error.status = 401;
        throw error;
      }

      try {
        const newAccessToken = await getOrStartTokenRefresh();
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return await request(endpoint, {
          ...options,
          headers: retryHeaders,
          _retry: true,
        });
      } catch (refreshErr) {
        // refreshAccessToken already executed logout()
        const error = new Error('Session expired. Please log in again.');
        error.status = 401;
        throw error;
      }
    }

    const error = new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
    error.status = response.status;
    error.data = errorJson;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Base Request
  request,

  // --- Auth APIs ---
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request('/auth/me'),
  },

  // --- Hackathon APIs ---
  hackathons: {
    getCurrentDetails: () => request('/hackathons/current/details'),
    getAll: () => request('/hackathons/'),
    getById: (id) => request(`/hackathons/${id}`),
    create: (data) =>
      request('/hackathons/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/hackathons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/hackathons/${id}`, {
        method: 'DELETE',
      }),
  },

  // --- CRM APIs (FAQs, Prizes, Challenges, Terms, Contact) ---
  crm: {
    getFaqs: () => request('/crm/faqs'),
    createFaq: (data) =>
      request('/crm/faqs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getPrizes: () => request('/crm/prizes'),
    createPrize: (data) =>
      request('/crm/prizes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getChallenges: () => request('/crm/challenges'),
    createChallenge: (data) =>
      request('/crm/challenges', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTerms: () => request('/crm/terms'),
    createTerms: (data) =>
      request('/crm/terms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    submitContact: (data) =>
      request('/crm/contact-us', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getContacts: () => request('/crm/contact-us'),
  },

  // --- Sponsors & Sponsorships APIs ---
  sponsors: {
    getAll: () => request('/sponsors/'),
    create: (data) =>
      request('/sponsors/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSponsorships: () => request('/sponsors/sponsorships/all'),
    createSponsorship: (data) =>
      request('/sponsors/sponsorships', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateSponsorship: (id, data) =>
      request(`/sponsors/sponsorships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // --- Schedules & Schedule Events APIs ---
  schedules: {
    getAll: () => request('/schedules/'),
    create: (data) =>
      request('/schedules/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createEvent: (scheduleId, eventData) =>
      request(`/schedules/${scheduleId}/events`, {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
  },

  // --- Teams, Participants, Registrations, Check-Ins, Tables ---
  teams: {
    getAll: () => request('/teams/'),
    getById: (id) => request(`/teams/${id}`),
    create: (data) =>
      request('/teams/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/teams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getParticipants: () => request('/teams/participants/all'),
    createParticipant: (data) =>
      request('/teams/participants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getRegistrations: () => request('/teams/registrations/all'),
    createRegistration: (data) =>
      request('/teams/registrations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateRegistration: (id, data) =>
      request(`/teams/registrations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getCheckIns: () => request('/teams/check-ins/all'),
    createCheckIn: (data) =>
      request('/teams/check-ins', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTables: () => request('/teams/tables/all'),
    assignTable: (data) =>
      request('/teams/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // --- Organizers, Departments & Tasks ---
  organizers: {
    getDepartments: () => request('/organizers/departments'),
    createDepartment: (data) =>
      request('/organizers/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getAll: (hackathonId) => {
      const q = hackathonId ? `?hackathon_id=${encodeURIComponent(hackathonId)}` : '';
      return request(`/organizers/${q}`);
    },
    getById: (id) => request(`/organizers/${id}`),
    create: (data) =>
      request('/organizers/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/organizers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/organizers/${id}`, {
        method: 'DELETE',
      }),
    uploadImage: (id, file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request(`/organizers/${id}/image`, {
        method: 'POST',
        body: formData,
      });
    },

    getTasks: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/organizers/tasks/all${query ? `?${query}` : ''}`);
    },
    createTask: (data) =>
      request('/organizers/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTask: (id, data) =>
      request(`/organizers/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteTask: (id) =>
      request(`/organizers/tasks/${id}`, {
        method: 'DELETE',
      }),
  },

  // --- Notifications ---
  notifications: {
    getAll: () => request('/notifications/'),
    create: (data) =>
      request('/notifications/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // --- Users & Groups ---
  users: {
    login: async (credentials) => {
      const response = await request('/users/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
        _retry: true,
      });

      // Automatically extract and store Bearer access and refresh token received from backend
      const token =
        response?.access ||
        response?.token ||
        response?.access_token ||
        response?.key ||
        response?.auth_token ||
        response?.data?.token ||
        response?.data?.access ||
        response?.tokens?.access ||
        (typeof response === 'string' ? response : null);

      const refreshToken =
        response?.refresh ||
        response?.refresh_token ||
        response?.data?.refresh ||
        response?.tokens?.refresh;

      if (token) {
        setAuthToken(token);
      }
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      return response;
    },
    refreshToken: (token) => {
      const refresh = token || getRefreshToken();
      return request('/users/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
        _retry: true,
      });
    },
    register: (userData) =>
      request('/users/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    listGroups: () => request('/users/groups/list_groups/'),
    listPermissions: () => request('/users/groups/list_permissions/'),
    createGroup: (groupData) =>
      request('/users/groups/create_group/', {
        method: 'POST',
        body: JSON.stringify(groupData),
      }),
    getAll: (params = {}) => {
      let queryStr = '';
      if (typeof params === 'string') {
        queryStr = params ? `?search=${encodeURIComponent(params)}` : '';
      } else if (params && typeof params === 'object') {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.group) queryParams.set('group', params.group);
        if (params.page) queryParams.set('page', params.page);
        const str = queryParams.toString();
        queryStr = str ? `?${str}` : '';
      }
      return request(`/users/${queryStr}`);
    },
    getById: (id) => request(`/users/${id}/`),
    getDetail: (id) => request(`/users/${id}/`),
    create: (data) =>
      request('/users/register/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: async (id, data, options = {}) => {
      const method = options.method || 'PATCH';
      try {
        return await request(`/users/${id}/update/`, {
          method,
          body: JSON.stringify(data),
          ...options,
        });
      } catch (err) {
        if (err?.status === 404) {
          return await request(`/users/${id}/`, {
            method,
            body: JSON.stringify(data),
            ...options,
          });
        }
        throw err;
      }
    },
    adminUpdate: (id, data, options = {}) => {
      return api.users.update(id, data, options);
    },
    getProfile: () => request('/users/profile/'),
    updateProfile: (data, options = {}) =>
      request('/users/profile/', {
        method: options.method || 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    getGroups: () => request('/users/groups/list_groups/'),
  },

  // --- Activity / Audit Logs ---
  activities: {
    getAll: (params = {}) => {
      let queryStr = '';
      if (typeof params === 'string') {
        queryStr = params ? `?search=${encodeURIComponent(params)}` : '';
      } else if (params && typeof params === 'object') {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.page) queryParams.set('page', params.page);
        if (params.action_type) queryParams.set('action_type', params.action_type);
        const str = queryParams.toString();
        queryStr = str ? `?${str}` : '';
      }
      return request(`/activities/${queryStr}`);
    },
  },
};

export default api;
