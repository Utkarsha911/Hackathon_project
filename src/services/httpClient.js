import axios from 'axios';
import {
  API_BASE_URL,
  getAdminAuthToken,
  getCustomerAuthToken
} from './api';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

httpClient.interceptors.request.use((config) => {
  const isAdminRequest =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/admin-control-site') ||
      window.location.pathname.startsWith('/admin'));
  const token = isAdminRequest ? getAdminAuthToken() : getCustomerAuthToken();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Request failed.';
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    normalizedError.data = error.response?.data;
    normalizedError.config = error.config;
    return Promise.reject(normalizedError);
  }
);

export default httpClient;
