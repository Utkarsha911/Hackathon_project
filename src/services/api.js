// In-memory response cache for GET requests
const apiCache = new Map();
// In-flight request deduplication map
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes default TTL

export function clearApiCache(endpointPrefix = '') {
  if (!endpointPrefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(endpointPrefix)) {
        apiCache.delete(key);
      }
    }
  }
}

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

export function buildQueryString(params = {}) {
  if (typeof params === 'string') {
    return params ? (params.startsWith('?') ? params : `?${params}`) : '';
  }
  if (!params || typeof params !== 'object') return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      searchParams.append(k, v);
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
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

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('bic_user') || localStorage.getItem('bic_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('bic_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('bic_user');
  }
}

export function clearCurrentUser() {
  localStorage.removeItem('bic_user');
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem('bic_admin_user') || localStorage.getItem('bic_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminUser(user) {
  if (user) {
    localStorage.setItem('bic_admin_user', JSON.stringify(user));
    localStorage.setItem('bic_user', JSON.stringify(user));
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
  clearCurrentUser();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bic_auth_logout'));
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken() && (getCurrentUser() || getAdminUser()));
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
 * Core HTTP Request Wrapper with in-memory caching, in-flight deduplication, token refresh, and auto-logout
 */
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const forceRefresh = Boolean(options.forceRefresh || options._retry);
  const cacheKey = `${method}:${endpoint}`;

  // If a mutation occurs (POST, PUT, PATCH, DELETE), invalidate affected GET caches
  if (!isGet) {
    if (endpoint.includes('/users/groups')) {
      clearApiCache('/users/groups');
    } else if (endpoint.includes('/users/')) {
      clearApiCache('/users/');
    } else if (endpoint.includes('/teams')) {
      clearApiCache('/teams');
    } else if (endpoint.includes('/hackathons')) {
      clearApiCache('/hackathons');
    }
  }

  // Check GET cache first
  if (isGet && !forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < (options.ttl || DEFAULT_CACHE_TTL))) {
      return cached.data;
    }
    // Deduplicate in-flight concurrent requests for the exact same GET endpoint
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }
  }

  const executeRequest = async () => {
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
        if (errorJson) {
          if (typeof errorJson === 'string') {
            errorDetail = errorJson;
          } else if (Array.isArray(errorJson.non_field_errors) && errorJson.non_field_errors.length > 0) {
            errorDetail = errorJson.non_field_errors.join(' ');
          } else if (typeof errorJson.non_field_errors === 'string') {
            errorDetail = errorJson.non_field_errors;
          } else if (errorJson.detail) {
            errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
          } else if (errorJson.message) {
            errorDetail = typeof errorJson.message === 'string' ? errorJson.message : JSON.stringify(errorJson.message);
          } else if (errorJson.error) {
            errorDetail = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
          } else if (typeof errorJson === 'object') {
            const values = Object.entries(errorJson).map(([key, val]) => {
              const fieldName = key.replace(/_/g, ' ');
              const msg = Array.isArray(val) ? val.join(' ') : typeof val === 'string' ? val : JSON.stringify(val);
              return `${fieldName}: ${msg}`;
            });
            if (values.length > 0) {
              errorDetail = values.join('; ');
            }
          }
        }
      } catch {
        // ignore json parse error
      }

      // Detect SimpleJWT expired token or invalid token responses
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
        endpoint.includes('/users/google') ||
        endpoint.includes('/auth/login');

      // If token expired and this is not already a retry or refresh call, attempt refresh
      if ((isTokenNotValid || response.status === 401) && !options._retry && !isAuthEndpoint) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
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

    const data = await response.json();
    if (isGet) {
      apiCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data;
  };

  if (isGet && !forceRefresh) {
    const p = executeRequest().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, p);
    return p;
  }

  return executeRequest();
}

export const api = {
  // Base Request & Cache Management
  request,
  clearCache: clearApiCache,

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
    getCurrentHackathon: (options = {}) => request('/hackathons/current-hackathon/', options),
    getCurrent: (options = {}) => request('/hackathons/current-hackathon/', options),
    getCurrentDetails: (options = {}) => request('/hackathons/current-hackathon/', options),
    getAll: (params = {}, options = {}) => {
      let query = '';
      if (typeof params === 'object' && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            searchParams.append(k, v);
          }
        });
        const str = searchParams.toString();
        if (str) query = `?${str}`;
      }
      return request(`/hackathons/${query}`, options);
    },
    getById: (id, options = {}) => request(`/hackathons/${id}`, options),
    create: (data, options = {}) =>
      request('/hackathons/', {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons/${id}`, {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/${id}`, {
        method: 'PATCH',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons/${id}/`, {
        method: 'DELETE',
        ...options,
      }),

    // --- Nested Hackathon Sponsors APIs ---
    sponsors: {
      getAll: (params = {}, options = {}) => request(`/hackathons/sponsors/${buildQueryString(params)}`, options),
      getById: (id, options = {}) => request(`/hackathons/sponsors/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/sponsors/', {
          method: 'POST',
          body: data instanceof FormData ? data : JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/sponsors/${id}/`, {
          method: 'PUT',
          body: data instanceof FormData ? data : JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/sponsors/${id}/`, {
          method: 'PATCH',
          body: data instanceof FormData ? data : JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/sponsors/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },

    // --- Sponsor Packages APIs ---
    sponsorPackages: {
      getAll: (params = {}, options = {}) => request(`/hackathons/sponsor-packages/${buildQueryString(params)}`, options),
      getById: (id, options = {}) => request(`/hackathons/sponsor-packages/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/sponsor-packages/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/sponsor-packages/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/sponsor-packages/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/sponsor-packages/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },

    // --- Sponsor Package Types APIs ---
    sponsorPackageTypes: {
      getAll: (params = {}, options = {}) => request(`/hackathons/sponsor-package-types/${buildQueryString(params)}`, options),
      getById: (id, options = {}) => request(`/hackathons/sponsor-package-types/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/sponsor-package-types/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/sponsor-package-types/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/sponsor-package-types/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/sponsor-package-types/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },
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

  // --- Sponsors, Sponsor Packages, & Package Types APIs ---
  sponsors: {
    getAll: (params = {}, options = {}) => request(`/hackathons/sponsors/${buildQueryString(params)}`, options),
    getById: (id, options = {}) => request(`/hackathons/sponsors/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons/sponsors/', {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons/sponsors/${id}/`, {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/sponsors/${id}/`, {
        method: 'PATCH',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons/sponsors/${id}/`, {
        method: 'DELETE',
        ...options,
      }),

    // Packages
    getPackages: (params = {}, options = {}) => request(`/hackathons/sponsor-packages/${buildQueryString(params)}`, options),
    getPackageById: (id, options = {}) => request(`/hackathons/sponsor-packages/${id}/`, options),
    createPackage: (data, options = {}) =>
      request('/hackathons/sponsor-packages/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    updatePackage: (id, data, options = {}) =>
      request(`/hackathons/sponsor-packages/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patchPackage: (id, data, options = {}) =>
      request(`/hackathons/sponsor-packages/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    deletePackage: (id, options = {}) =>
      request(`/hackathons/sponsor-packages/${id}/`, {
        method: 'DELETE',
        ...options,
      }),

    // Package Types
    getPackageTypes: (params = {}, options = {}) => request(`/hackathons/sponsor-package-types/${buildQueryString(params)}`, options),
    getPackageTypeById: (id, options = {}) => request(`/hackathons/sponsor-package-types/${id}/`, options),
    createPackageType: (data, options = {}) =>
      request('/hackathons/sponsor-package-types/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    updatePackageType: (id, data, options = {}) =>
      request(`/hackathons/sponsor-package-types/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patchPackageType: (id, data, options = {}) =>
      request(`/hackathons/sponsor-package-types/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    deletePackageType: (id, options = {}) =>
      request(`/hackathons/sponsor-package-types/${id}/`, {
        method: 'DELETE',
        ...options,
      }),

    // Backward-compat aliases
    getSponsorships: (params = {}, options = {}) => request(`/hackathons/sponsor-packages/${buildQueryString(params)}`, options),
    createSponsorship: (data, options = {}) =>
      request('/hackathons/sponsor-packages/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    updateSponsorship: (id, data, options = {}) =>
      request(`/hackathons/sponsor-packages/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
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
    getAll: (options = {}) => request('/teams/', options),
    getById: (id, options = {}) => request(`/teams/${id}`, options),
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

      const userData =
        response?.user || {
          email: response?.email || credentials?.email,
          first_name: response?.first_name || (credentials?.email ? credentials.email.split('@')[0] : 'Admin'),
          last_name: response?.last_name || 'User',
          role: response?.role || 'Administrator',
          groups: response?.groups || [0],
          ...response,
        };

      setCurrentUser(userData);
      setAdminUser(userData);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bic_user_updated', { detail: userData }));
        window.dispatchEvent(new CustomEvent('bic_auth_login', { detail: { user: userData, response } }));
      }

      return response;
    },
    googleLogin: async (token) => {
      // Handles token string or object payload { token: "string" }
      const tokenString =
        typeof token === 'string'
          ? token.trim()
          : token?.token || token?.credential || token?.id_token || '';

      if (!tokenString) {
        throw new Error('Google token is required.');
      }

      // Calls POST /api/v1/users/google/ with { "token": "string" }
      const response = await request('/users/google/', {
        method: 'POST',
        body: JSON.stringify({ token: tokenString }),
        _retry: true,
      });

      // Extract access and refresh tokens
      const accessToken =
        response?.tokens?.access ||
        response?.access ||
        response?.token ||
        response?.access_token ||
        response?.data?.access ||
        response?.data?.token ||
        (typeof response === 'string' ? response : null);

      const refreshToken =
        response?.tokens?.refresh ||
        response?.refresh ||
        response?.refresh_token ||
        response?.data?.refresh;

      if (accessToken) {
        setAuthToken(accessToken);
      }
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      // Extract user info
      const userData =
        response?.user ||
        response?.data?.user || {
          email: response?.email,
          first_name: response?.first_name || '',
          last_name: response?.last_name || '',
          role: response?.role || 'User',
          ...response,
        };

      setCurrentUser(userData);

      // Check if user has admin/staff privileges
      const role = (userData.role || '').toLowerCase();
      const isStaffOrAdmin =
        userData.is_staff ||
        userData.is_superuser ||
        role.includes('admin') ||
        role.includes('staff') ||
        role.includes('organizer') ||
        (Array.isArray(userData.groups) && (userData.groups.includes(0) || userData.groups.includes('admin')));

      if (isStaffOrAdmin) {
        setAdminUser(userData);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bic_user_updated', { detail: userData }));
        window.dispatchEvent(new CustomEvent('bic_auth_login', { detail: { user: userData, response } }));
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
    listGroups: (options = {}) => request('/users/groups/list_groups/', options),
    listPermissions: (options = {}) => request('/users/groups/list_permissions/', options),
    createGroup: (groupData) =>
      request('/users/groups/create_group/', {
        method: 'POST',
        body: JSON.stringify(groupData),
      }),
    updateGroup: async (id, groupData, options = {}) => {
      const cleanId = typeof id === 'object' && id !== null ? id.id : id;
      const method = options.method || 'PUT';
      try {
        return await request(`/users/groups/${cleanId}/update_group/`, {
          method,
          body: JSON.stringify(groupData),
          ...options,
        });
      } catch (err) {
        // Fallback between PUT and PATCH if backend requires one over the other
        if (err?.status === 405) {
          const fallbackMethod = method === 'PUT' ? 'PATCH' : 'PUT';
          return await request(`/users/groups/${cleanId}/update_group/`, {
            method: fallbackMethod,
            body: JSON.stringify(groupData),
            ...options,
          });
        }
        throw err;
      }
    },
    updateGroupPermissions: (id, groupData, options = {}) =>
      api.users.updateGroup(id, groupData, options),
    getAll: (params = {}, options = {}) => {
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
      return request(`/users/${queryStr}`, options);
    },
    getById: (id, options = {}) => request(`/users/${id}/`, options),
    getDetail: (id, options = {}) => request(`/users/${id}/`, options),
    create: (data, options = {}) => {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      return request('/users/register/', {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
        ...options,
      });
    },
    update: async (id, data, options = {}) => {
      const method = options.method || 'PATCH';
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      try {
        return await request(`/users/${id}/update/`, {
          method,
          body: isFormData ? data : JSON.stringify(data),
          ...options,
        });
      } catch (err) {
        if (err?.status === 404) {
          return await request(`/users/${id}/`, {
            method,
            body: isFormData ? data : JSON.stringify(data),
            ...options,
          });
        }
        throw err;
      }
    },
    adminUpdate: (id, data, options = {}) => {
      return api.users.update(id, data, options);
    },
    getProfile: (options = {}) => request('/users/profile/', options),
    updateProfile: (data, options = {}) => {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      return request('/users/profile/', {
        method: options.method || 'PATCH',
        body: isFormData ? data : JSON.stringify(data),
        ...options,
      });
    },
    getGroups: (options = {}) => request('/users/groups/list_groups/', options),
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
