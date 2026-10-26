import permissionsData from '../data/json/permissions.json';

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

import defaultUserImage from '../assets/default-image.webp';

export const DEFAULT_USER_AVATAR = defaultUserImage;

export function getUserAvatarUrl(pathOrUser) {
  if (!pathOrUser) return DEFAULT_USER_AVATAR;
  const path = typeof pathOrUser === 'string' ? pathOrUser : pathOrUser?.profile_picture;
  if (!path || path === 'null' || path === 'undefined') return DEFAULT_USER_AVATAR;
  return getMediaUrl(path);
}

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

export function formatThrottleMessage(errorOrMsg) {
  const msg =
    typeof errorOrMsg === 'string'
      ? errorOrMsg
      : errorOrMsg?.data?.detail || errorOrMsg?.detail || errorOrMsg?.message || '';

  const match = msg.match(/available in (\d+)\s*seconds/i);
  if (match) {
    const totalSeconds = parseInt(match[1], 10);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.ceil((totalSeconds % 3600) / 60);
    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours} hour${hours > 1 ? 's' : ''}`;
      if (minutes > 0) timeStr += ` and ${minutes} min`;
    } else {
      timeStr = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `You have already sent an inquiry today. Please wait ${timeStr} before sending another message, or email operations@bichackathon.org directly.`;
  }

  if (msg.toLowerCase().includes('throttled')) {
    return 'You have already sent an inquiry today. Please wait before submitting another message, or email operations@bichackathon.org directly.';
  }

  return msg || 'Request was throttled. Please try again later.';
}

export function isAdminContext() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path.startsWith('/admin-control-site') || path.startsWith('/admin');
}

// ---------------------------------------------------------------------
// Admin Tokens & State (bic_admin_auth_token, bic_admin_refresh_token, bic_admin_user)
// ---------------------------------------------------------------------
export function getAdminAuthToken() {
  if (typeof localStorage === 'undefined') return '';
  return (
    localStorage.getItem('bic_admin_auth_token') ||
    localStorage.getItem('bic_admin_access_token') ||
    ''
  );
}

export function setAdminAuthToken(token) {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    const cleanToken =
      typeof token === 'string' && token.startsWith('Bearer ')
        ? token.slice(7).trim()
        : token;
    localStorage.setItem('bic_admin_auth_token', cleanToken);
  } else {
    localStorage.removeItem('bic_admin_auth_token');
    localStorage.removeItem('bic_admin_access_token');
  }
}

export function clearAdminAuthToken() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('bic_admin_auth_token');
  localStorage.removeItem('bic_admin_access_token');
}

export function getAdminRefreshToken() {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('bic_admin_refresh_token') || '';
}

export function setAdminRefreshToken(token) {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    const cleanToken =
      typeof token === 'string' && token.startsWith('Bearer ')
        ? token.slice(7).trim()
        : token;
    localStorage.setItem('bic_admin_refresh_token', cleanToken);
  } else {
    localStorage.removeItem('bic_admin_refresh_token');
  }
}

export function clearAdminRefreshToken() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('bic_admin_refresh_token');
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
  if (typeof localStorage === 'undefined') return;
  if (user) {
    localStorage.setItem('bic_admin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('bic_admin_user');
  }
}

export function clearAdminUser() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('bic_admin_user');
}

// ---------------------------------------------------------------------
// Customer Tokens & State (bic_customer_auth_token, bic_customer_refresh_token, bic_customer_user)
// ---------------------------------------------------------------------
export function getCustomerAuthToken() {
  if (typeof localStorage === 'undefined') return '';
  return (
    localStorage.getItem('bic_customer_auth_token') ||
    localStorage.getItem('bic_auth_token') ||
    ''
  );
}

export function setCustomerAuthToken(token) {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    const cleanToken =
      typeof token === 'string' && token.startsWith('Bearer ')
        ? token.slice(7).trim()
        : token;
    localStorage.setItem('bic_customer_auth_token', cleanToken);
    // Legacy fallback mirror for customer
    localStorage.setItem('bic_auth_token', cleanToken);
  } else {
    localStorage.removeItem('bic_customer_auth_token');
    localStorage.removeItem('bic_auth_token');
  }
}

export function clearCustomerAuthToken() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('bic_customer_auth_token');
  localStorage.removeItem('bic_auth_token');
}

export function getCustomerRefreshToken() {
  if (typeof localStorage === 'undefined') return '';
  return (
    localStorage.getItem('bic_customer_refresh_token') ||
    localStorage.getItem('bic_refresh_token') ||
    ''
  );
}

export function setCustomerRefreshToken(token) {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    const cleanToken =
      typeof token === 'string' && token.startsWith('Bearer ')
        ? token.slice(7).trim()
        : token;
    localStorage.setItem('bic_customer_refresh_token', cleanToken);
    localStorage.setItem('bic_refresh_token', cleanToken);
  } else {
    localStorage.removeItem('bic_customer_refresh_token');
    localStorage.removeItem('bic_refresh_token');
  }
}

export function clearCustomerRefreshToken() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('bic_customer_refresh_token');
  localStorage.removeItem('bic_refresh_token');
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('bic_customer_user') || localStorage.getItem('bic_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof localStorage === 'undefined') return;
  if (user) {
    localStorage.setItem('bic_customer_user', JSON.stringify(user));
    localStorage.setItem('bic_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('bic_customer_user');
    localStorage.removeItem('bic_user');
  }
}

export function clearCurrentUser() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('bic_customer_user');
  localStorage.removeItem('bic_user');
}

// ---------------------------------------------------------------------
// Scope-Aware General Token Wrappers (Backward Compatible)
// ---------------------------------------------------------------------
export function getAuthToken(scope) {
  const isAdm = scope === 'admin' || (!scope && isAdminContext());
  return isAdm ? getAdminAuthToken() : getCustomerAuthToken();
}

export function setAuthToken(token, scope) {
  const isAdm = scope === 'admin' || (!scope && isAdminContext());
  if (isAdm) {
    setAdminAuthToken(token);
  } else {
    setCustomerAuthToken(token);
  }
}

export function clearAuthToken(scope) {
  if (scope === 'admin') {
    clearAdminAuthToken();
  } else if (scope === 'customer') {
    clearCustomerAuthToken();
  } else if (isAdminContext()) {
    clearAdminAuthToken();
  } else {
    clearCustomerAuthToken();
  }
}

export function getRefreshToken(scope) {
  const isAdm = scope === 'admin' || (!scope && isAdminContext());
  return isAdm ? getAdminRefreshToken() : getCustomerRefreshToken();
}

export function setRefreshToken(token, scope) {
  const isAdm = scope === 'admin' || (!scope && isAdminContext());
  if (isAdm) {
    setAdminRefreshToken(token);
  } else {
    setCustomerRefreshToken(token);
  }
}

export function clearRefreshToken(scope) {
  if (scope === 'admin') {
    clearAdminRefreshToken();
  } else if (scope === 'customer') {
    clearCustomerRefreshToken();
  } else if (isAdminContext()) {
    clearAdminRefreshToken();
  } else {
    clearCustomerRefreshToken();
  }
}

export function adminLogout() {
  const hadSession = Boolean(getAdminAuthToken() || getAdminRefreshToken() || getAdminUser());
  clearAdminAuthToken();
  clearAdminRefreshToken();
  clearAdminUser();
  if (hadSession && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bic_admin_logout'));
  }
}

export function customerLogout() {
  // A visitor who never logged in has nothing to log out of: no event, no "logged out" toast.
  const hadSession = Boolean(getCustomerAuthToken() || getCustomerRefreshToken() || getCurrentUser());
  clearCustomerAuthToken();
  clearCustomerRefreshToken();
  clearCurrentUser();
  if (hadSession && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bic_customer_logout'));
    window.dispatchEvent(new CustomEvent('bic_auth_logout'));
  }
}

export function logout(scope) {
  if (scope === 'admin') {
    adminLogout();
  } else if (scope === 'customer') {
    customerLogout();
  } else if (isAdminContext()) {
    adminLogout();
  } else {
    customerLogout();
  }
}

export function isAuthenticated() {
  return Boolean(getCustomerAuthToken() && getCurrentUser());
}

export function isAdminAuthenticated() {
  return Boolean(getAdminAuthToken() || getAdminUser());
}

export function getSelectedAdminHackathon() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('bic_admin_selected_hackathon') || '';
}

export function setSelectedAdminHackathon(id) {
  if (typeof window === 'undefined') return;
  if (id && id !== 'all') {
    localStorage.setItem('bic_admin_selected_hackathon', id);
  } else {
    localStorage.removeItem('bic_admin_selected_hackathon');
  }
  clearApiCache();
  window.dispatchEvent(new CustomEvent('bic_admin_hackathon_changed', { detail: id }));
}

function applyAdminHackathonFilter(endpoint) {
  if (typeof window === 'undefined') return endpoint;
  if (!window.location.pathname.startsWith('/admin-control-site')) return endpoint;

  const activeHackathon = getSelectedAdminHackathon();
  if (!activeHackathon || activeHackathon === 'all') return endpoint;

  const cleanPath = endpoint.split('?')[0];
  // Do NOT filter endpoints that are part of global metadata, auth, or the hackathon listing itself
  if (
    cleanPath === '/hackathons/' ||
    cleanPath === '/hackathons' ||
    cleanPath.startsWith('/hackathons/current') ||
    cleanPath.startsWith('/users/') ||
    cleanPath.startsWith('/system/') ||
    cleanPath.startsWith('/logs/') ||
    cleanPath.startsWith('/hackathons-crm/contacts')
  ) {
    return endpoint;
  }

  const [base, query] = endpoint.split('?');
  const params = new URLSearchParams(query || '');
  let changed = false;
  if (!params.has('hackathon')) {
    params.set('hackathon', activeHackathon);
    changed = true;
  }
  if (changed) {
    return `${base}?${params.toString()}`;
  }

  return endpoint;
}

/**
 * Concurrency-safe token refresh mechanism with scope separation
 */
let refreshPromiseAdmin = null;
let refreshPromiseCustomer = null;

export async function refreshAccessToken(scope) {
  const isAdm = scope === 'admin' || (!scope && isAdminContext());
  const currentRefreshToken = isAdm ? getAdminRefreshToken() : getCustomerRefreshToken();
  if (!currentRefreshToken) {
    if (isAdm) adminLogout();
    else customerLogout();
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
      if (isAdm) adminLogout();
      else customerLogout();
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
      if (isAdm) adminLogout();
      else customerLogout();
      throw new Error('No access token returned from refresh endpoint');
    }

    if (isAdm) {
      setAdminAuthToken(newAccessToken);
      if (newRefreshToken) setAdminRefreshToken(newRefreshToken);
    } else {
      setCustomerAuthToken(newAccessToken);
      if (newRefreshToken) setCustomerRefreshToken(newRefreshToken);
    }

    return newAccessToken;
  } catch (err) {
    if (isAdm) adminLogout();
    else customerLogout();
    throw err;
  } finally {
    if (isAdm) refreshPromiseAdmin = null;
    else refreshPromiseCustomer = null;
  }
}

function getOrStartTokenRefresh(scope) {
  const isAdm = scope === 'admin' || (!scope && isAdminContext());
  if (isAdm) {
    if (!refreshPromiseAdmin) {
      refreshPromiseAdmin = refreshAccessToken('admin');
    }
    return refreshPromiseAdmin;
  } else {
    if (!refreshPromiseCustomer) {
      refreshPromiseCustomer = refreshAccessToken('customer');
    }
    return refreshPromiseCustomer;
  }
}

/**
 * Core HTTP Request Wrapper with in-memory caching, in-flight deduplication, token refresh, and auto-logout
 */
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const forceRefresh = Boolean(options.forceRefresh || options._retry);
  const resolvedEndpoint = isGet && !options.skipHackathonFilter
    ? applyAdminHackathonFilter(endpoint)
    : endpoint;
  const cacheKey = `${method}:${resolvedEndpoint}`;

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
    const url = `${API_BASE_URL}${resolvedEndpoint.startsWith('/') ? resolvedEndpoint : `/${resolvedEndpoint}`}`;
    const isAdm = options.scope === 'admin' || (!options.scope && isAdminContext());
    const token = options.token || (isAdm ? getAdminAuthToken() : getCustomerAuthToken());

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
        const refreshToken = isAdm ? getAdminRefreshToken() : getCustomerRefreshToken();
        if (!refreshToken) {
          if (isAdm) adminLogout();
          else customerLogout();
          const error = new Error('Session expired. Please log in again.');
          error.status = 401;
          throw error;
        }

        try {
          const newAccessToken = await getOrStartTokenRefresh(isAdm ? 'admin' : 'customer');
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
    getById: (id, options = {}) => request(`/hackathons/${id}/`, options),
    create: (data, options = {}) => {
      let bodyData = data;
      if (data instanceof FormData) {
        if (!data.has('is_current')) {
          data.append('is_current', 'true');
        }
      } else if (data && typeof data === 'object') {
        bodyData = { is_current: true, ...data };
      }
      return request('/hackathons/', {
        method: 'POST',
        body: bodyData instanceof FormData ? bodyData : JSON.stringify(bodyData),
        ...options,
      });
    },
    update: (id, data, options = {}) =>
      request(`/hackathons/${id}/`, {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/${id}/`, {
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

    // --- Admin Schedules APIs (/api/v1/hackathons/admin/schedules/) ---
    adminSchedules: {
      getAll: (params = {}, options = {}) =>
        request(`/hackathons/admin/schedules/${buildQueryString(params)}`, options),
      getById: (id, options = {}) =>
        request(`/hackathons/admin/schedules/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/admin/schedules/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/admin/schedules/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/admin/schedules/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/admin/schedules/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
      updateStatus: (id, data, options = {}) =>
        request(`/hackathons/admin/schedules/${id}/update-status/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
    },

    // --- Admin Schedule Events APIs (/api/v1/hackathons/admin/schedule-events/) ---
    adminScheduleEvents: {
      getAll: (params = {}, options = {}) =>
        request(`/hackathons/admin/schedule-events/${buildQueryString(params)}`, options),
      getById: (id, options = {}) =>
        request(`/hackathons/admin/schedule-events/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/admin/schedule-events/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/admin/schedule-events/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/admin/schedule-events/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/admin/schedule-events/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },

    // --- Hackathon Committee Organizers APIs (/hackathons/organizers/) ---
    organizers: {
      getAll: (params = {}, options = {}) =>
        request(`/hackathons/organizers/${buildQueryString(params)}`, options),
      getById: (id, options = {}) =>
        request(`/hackathons/organizers/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/organizers/', {
          method: 'POST',
          body: data instanceof FormData ? data : JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/organizers/${id}/`, {
          method: 'PUT',
          body: data instanceof FormData ? data : JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/organizers/${id}/`, {
          method: 'PATCH',
          body: data instanceof FormData ? data : JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/organizers/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },

    // --- Hackathon Departments APIs (/hackathons/department/) ---
    departments: {
      getAll: (params = {}, options = {}) =>
        request(`/hackathons/department/${buildQueryString(params)}`, options),
      getById: (id, options = {}) =>
        request(`/hackathons/department/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/department/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/department/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/department/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/department/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },

    // --- Hackathon Organizer Tasks APIs (/hackathons/organizer-tasks/) ---
    organizerTasks: {
      getAll: (params = {}, options = {}) =>
        request(`/hackathons/organizer-tasks/${buildQueryString(params)}`, options),
      getById: (id, options = {}) =>
        request(`/hackathons/organizer-tasks/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/organizer-tasks/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/organizer-tasks/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/organizer-tasks/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/organizer-tasks/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },

    // --- Hackathon Teams APIs (/hackathons/teams/) ---
    teams: {
      getAll: (params = {}, options = {}) =>
        request(`/hackathons/teams/${buildQueryString(params)}`, options),
      getById: (id, options = {}) =>
        request(`/hackathons/teams/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/teams/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/teams/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/teams/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
    },

    // --- Admin Hackathon Teams APIs (/hackathons/admin/teams/) ---
    adminTeams: {
      getAll: (params = {}, options = {}) =>
        request(`/hackathons/admin/teams/${buildQueryString(params)}`, options),
      getById: (id, options = {}) =>
        request(`/hackathons/admin/teams/${id}/`, options),
      create: (data, options = {}) =>
        request('/hackathons/admin/teams/', {
          method: 'POST',
          body: JSON.stringify(data),
          ...options,
        }),
      update: (id, data, options = {}) =>
        request(`/hackathons/admin/teams/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options,
        }),
      patch: (id, data, options = {}) =>
        request(`/hackathons/admin/teams/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          ...options,
        }),
      delete: (id, options = {}) =>
        request(`/hackathons/admin/teams/${id}/`, {
          method: 'DELETE',
          ...options,
        }),
    },
  },

  // --- Hackathons CRM: FAQs ---
  faqs: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons-crm/faqs/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons-crm/faqs/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons-crm/faqs/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons-crm/faqs/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons-crm/faqs/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons-crm/faqs/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
  },

  // --- Hackathons CRM: Prizes ---
  prizes: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons-crm/prizes/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons-crm/prizes/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons-crm/prizes/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons-crm/prizes/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons-crm/prizes/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons-crm/prizes/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
  },

  // --- Hackathons CRM: Contacts ---
  contacts: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons-crm/contacts/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons-crm/contacts/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons-crm/contacts/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons-crm/contacts/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons-crm/contacts/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons-crm/contacts/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
  },

  // --- CRM APIs (FAQs, Prizes, Challenges, Terms, Contact) ---
  crm: {
    getFaqs: (params = {}, options = {}) =>
      request(`/hackathons-crm/faqs/${buildQueryString(params)}`, options),
    createFaq: (data, options = {}) =>
      request('/hackathons-crm/faqs/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),

    getPrizes: (params = {}, options = {}) =>
      request(`/hackathons-crm/prizes/${buildQueryString(params)}`, options),
    createPrize: (data, options = {}) =>
      request('/hackathons-crm/prizes/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),

    getChallenges: () => request('/crm/challenges'),
    createChallenge: (data) =>
      request('/crm/challenges', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTerms: (params = {}, options = {}) =>
      request(`/hackathons-crm/terms/${buildQueryString(params)}`, options)
        .catch(() => request('/crm/terms', options)),
    createTerms: (data, options = {}) =>
      request('/hackathons-crm/terms/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
  // ---- Singular term CRUD helpers (admin UI) ----
  // Create a single term
  createTerm: (data, options = {}) =>
    request('/hackathons-crm/terms/', {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }),

  // Update a term
  updateTerm: (id, data, options = {}) =>
    request(`/hackathons-crm/terms/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }),

  // Delete a term
  deleteTerm: (id, options = {}) =>
    request(`/hackathons-crm/terms/${id}/`, {
      method: 'DELETE',
      ...options,
    }),
    submitContact: (data, options = {}) =>
      request('/hackathons-crm/contacts/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    getContacts: (params = {}, options = {}) =>
      request(`/hackathons-crm/contacts/${buildQueryString(params)}`, options),
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
    getAll: (params = {}, options = {}) =>
      request(`/hackathons/schedules/${buildQueryString(params)}`, options),
    create: (data) =>
      request('/hackathons/schedules/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createEvent: (scheduleId, eventData) =>
      request(`/hackathons/schedules/${scheduleId}/events`, {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
  },

  // --- Admin Schedules APIs (/api/v1/hackathons/admin/schedules/) ---
  adminSchedules: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons/admin/schedules/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons/admin/schedules/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons/admin/schedules/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons/admin/schedules/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/admin/schedules/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons/admin/schedules/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
    updateStatus: (id, data, options = {}) =>
      request(`/hackathons/admin/schedules/${id}/update-status/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
  },

  // --- Admin Schedule Events APIs (/api/v1/hackathons/admin/schedule-events/) ---
  adminScheduleEvents: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons/admin/schedule-events/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons/admin/schedule-events/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons/admin/schedule-events/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons/admin/schedule-events/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/admin/schedule-events/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons/admin/schedule-events/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
  },

  // --- Guests APIs (/api/v1/users/guests/) ---
  guests: {
    getAll: (params = {}, options = {}) =>
      request(`/users/guests/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/users/guests/${id}/`, options),
    create: (data, options = {}) =>
      request('/users/guests/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/users/guests/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/users/guests/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
  },

  // --- Participants APIs (/api/v1/users/participants/) ---
  participants: {
    getAll: (params = {}, options = {}) =>
      request(`/users/participants/${buildQueryString(params)}`, options),
  },

  // --- Teams, Participants, Registrations, Check-Ins, Tables ---
  teams: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons/admin/teams/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons/admin/teams/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons/teams/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons/admin/teams/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/admin/teams/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons/admin/teams/${id}/`, {
        method: 'DELETE',
        ...options,
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
      request(`/teams/registrations/${id}/`, {
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
  // --- Departments APIs (/hackathons/department/) ---
  departments: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons/department/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons/department/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons/department/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons/department/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/department/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons/department/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
  },

  // --- Organizer Tasks APIs (/hackathons/organizer-tasks/) ---
  organizerTasks: {
    getAll: (params = {}, options = {}) =>
      request(`/hackathons/organizer-tasks/${buildQueryString(params)}`, options),
    getById: (id, options = {}) =>
      request(`/hackathons/organizer-tasks/${id}/`, options),
    create: (data, options = {}) =>
      request('/hackathons/organizer-tasks/', {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    update: (id, data, options = {}) =>
      request(`/hackathons/organizer-tasks/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    patch: (id, data, options = {}) =>
      request(`/hackathons/organizer-tasks/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (id, options = {}) =>
      request(`/hackathons/organizer-tasks/${id}/`, {
        method: 'DELETE',
        ...options,
      }),
  },

  // --- Organizers, Departments & Tasks Legacy compatibility ---
  organizers: {
    getDepartments: (params = {}) => request(`/hackathons/department/${buildQueryString(params)}`),
    createDepartment: (data) =>
      request('/hackathons/department/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getAll: (hackathonId) => {
      const q = hackathonId ? `?hackathon_id=${encodeURIComponent(hackathonId)}` : '';
      return request(`/hackathons/organizers/${q}`);
    },
    getById: (id) => request(`/hackathons/organizers/${id}/`),
    create: (data) =>
      request('/hackathons/organizers/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/hackathons/organizers/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/hackathons/organizers/${id}/`, {
        method: 'DELETE',
      }),
    uploadImage: (id, file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request(`/hackathons/organizers/${id}/image`, {
        method: 'POST',
        body: formData,
      });
    },

    getTasks: (params = {}) => request(`/hackathons/organizer-tasks/${buildQueryString(params)}`),
    createTask: (data) =>
      request('/hackathons/organizer-tasks/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTask: (id, data) =>
      request(`/hackathons/organizer-tasks/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    patchTask: (id, data) =>
      request(`/hackathons/organizer-tasks/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteTask: (id) =>
      request(`/hackathons/organizer-tasks/${id}/`, {
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
    login: async (credentials, options = {}) => {
      const isAdm = options?.scope === 'admin' || (!options?.scope && isAdminContext());
      const response = await request('/users/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
        _retry: true,
        ...options,
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
        if (isAdm) {
          setAdminAuthToken(token);
        } else {
          setCustomerAuthToken(token);
        }
      }
      if (refreshToken) {
        if (isAdm) {
          setAdminRefreshToken(refreshToken);
        } else {
          setCustomerRefreshToken(refreshToken);
        }
      }

      const userData =
        response?.user || {
          email: response?.email || credentials?.email,
          first_name: response?.first_name || (credentials?.email ? credentials.email.split('@')[0] : (isAdm ? 'Admin' : 'User')),
          last_name: response?.last_name || (isAdm ? 'User' : ''),
          role: response?.role || (isAdm ? 'Administrator' : 'User'),
          groups: response?.groups || (isAdm ? [0] : []),
          ...response,
        };

      if (isAdm) {
        setAdminUser(userData);
      } else {
        setCurrentUser(userData);
      }

      if (typeof window !== 'undefined') {
        if (isAdm) {
          window.dispatchEvent(new CustomEvent('bic_admin_user_updated', { detail: userData }));
          window.dispatchEvent(new CustomEvent('bic_admin_login', { detail: { user: userData, response } }));
        } else {
          window.dispatchEvent(new CustomEvent('bic_user_updated', { detail: userData }));
          window.dispatchEvent(new CustomEvent('bic_customer_login', { detail: { user: userData, response } }));
          window.dispatchEvent(new CustomEvent('bic_auth_login', { detail: { user: userData, response } }));
        }
      }

      return response;
    },
    googleLogin: async (token, options = {}) => {
      // Handles token string or object payload { token: "string" }
      const tokenString =
        typeof token === 'string'
          ? token.trim()
          : token?.token || token?.credential || token?.id_token || '';

      if (!tokenString) {
        throw new Error('Google token is required.');
      }

      const isAdm = options?.scope === 'admin' || (!options?.scope && isAdminContext());

      // Calls POST /api/v1/users/google/ with { "token": "string" }
      const response = await request('/users/google/', {
        method: 'POST',
        body: JSON.stringify({ token: tokenString }),
        _retry: true,
        ...options,
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
        if (isAdm) {
          setAdminAuthToken(accessToken);
        } else {
          setCustomerAuthToken(accessToken);
        }
      }
      if (refreshToken) {
        if (isAdm) {
          setAdminRefreshToken(refreshToken);
        } else {
          setCustomerRefreshToken(refreshToken);
        }
      }

      // Extract user info
      const userData =
        response?.user ||
        response?.data?.user || {
          email: response?.email,
          first_name: response?.first_name || '',
          last_name: response?.last_name || '',
          role: response?.role || (isAdm ? 'Administrator' : 'User'),
          ...response,
        };

      if (isAdm) {
        setAdminUser(userData);
      } else {
        setCurrentUser(userData);
      }

      if (typeof window !== 'undefined') {
        if (isAdm) {
          window.dispatchEvent(new CustomEvent('bic_admin_user_updated', { detail: userData }));
          window.dispatchEvent(new CustomEvent('bic_admin_login', { detail: { user: userData, response } }));
        } else {
          window.dispatchEvent(new CustomEvent('bic_user_updated', { detail: userData }));
          window.dispatchEvent(new CustomEvent('bic_customer_login', { detail: { user: userData, response } }));
          window.dispatchEvent(new CustomEvent('bic_auth_login', { detail: { user: userData, response } }));
        }
      }

      return response;
    },
    refreshToken: (token, options = {}) => {
      const isAdm = options?.scope === 'admin' || (!options?.scope && isAdminContext());
      const refresh = token || (isAdm ? getAdminRefreshToken() : getCustomerRefreshToken());
      return request('/users/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
        _retry: true,
        ...options,
      });
    },
    register: (userData) =>
      request('/users/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    listGroups: (options = {}) => request('/users/groups/list_groups/', options),
    listPermissions: async (options = {}) => {
      try {
        const res = await request('/users/groups/list_permissions/', options);
        if (res && typeof res === 'object' && Object.keys(res).length > 0) {
          return res;
        }
        return permissionsData;
      } catch (err) {
        console.warn('listPermissions API unavailable, using permissions catalog fallback:', err);
        return permissionsData;
      }
    },
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
    getOrganizers: (params = {}, options = {}) => {
      let queryStr = '';
      if (typeof params === 'string') {
        queryStr = params ? `?search=${encodeURIComponent(params)}` : '';
      } else if (params && typeof params === 'object') {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.is_active !== undefined && params.is_active !== 'all' && params.is_active !== '') {
          queryParams.set('is_active', params.is_active);
        }
        if (params.is_staff !== undefined && params.is_staff !== 'all' && params.is_staff !== '') {
          queryParams.set('is_staff', params.is_staff);
        }
        if (params.ordering) queryParams.set('ordering', params.ordering);
        if (params.page) queryParams.set('page', params.page);
        if (params.page_size) queryParams.set('page_size', params.page_size);
        const str = queryParams.toString();
        queryStr = str ? `?${str}` : '';
      }
      return request(`/users/organizers/${queryStr}`, options);
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

export const getTerms = (params, options) => api.crm.getTerms(params, options);
export const createTerm = (data, options) => api.crm.createTerm(data, options);
export const createTerms = (data, options) => api.crm.createTerms(data, options);
export const updateTerm = (id, data, options) => api.crm.updateTerm(id, data, options);
export const deleteTerm = (id, options) => api.crm.deleteTerm(id, options);

export default api;
