import axios from 'axios';

const cleanEnvValue = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/^['"]|['"]$/g, '');
};

const isLocalhost = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1';

const resolveApiUrl = () => {
  const configured = cleanEnvValue(import.meta.env.VITE_API_URL);
  const hasWindow = typeof window !== 'undefined';
  const origin = hasWindow ? window.location.origin.toLowerCase() : '';
  const host = hasWindow ? window.location.hostname.toLowerCase() : '';

  // Production safety fallback for the live website when VITE_API_URL is misconfigured as "/api".
  const skyworldProdApi = 'https://skyworld-backend.onrender.com/api';
  const isSkyworldWebHost = host === 'skyworld.buzz' || host === 'www.skyworld.buzz';

  if (configured) {
    if (/^https?:\/\//i.test(configured)) {
      try {
        const parsed = new URL(configured);
        const parsedOrigin = parsed.origin.toLowerCase();
        const parsedPath = parsed.pathname || '';

        // If frontend is on skyworld.buzz and API URL accidentally points back to the same website origin,
        // force backend origin to avoid 405 on website hosting.
        if (
          isSkyworldWebHost &&
          parsedOrigin === origin &&
          parsedPath.startsWith('/api')
        ) {
          return skyworldProdApi;
        }
      } catch {
        // Fall through and return configured as-is
      }
      return configured;
    }

    if (configured.startsWith('/')) {
      if (isSkyworldWebHost) return skyworldProdApi;
      return configured;
    }

    return `https://${configured}`;
  }

  if (isSkyworldWebHost) return skyworldProdApi;
  if (hasWindow && isLocalhost(host)) return '/api';

  return 'http://localhost:5000/api';
};

const API_URL = resolveApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already refreshing to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error);
    else resolve(api(config));
  });
  failedQueue = [];
};

// Auth endpoints that should NEVER trigger the refresh interceptor
const AUTH_ENDPOINTS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/verify-otp',
  '/auth/resend-otp'
];

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // Skip refresh logic for auth endpoints (prevents infinite loop)
    const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => requestUrl.includes(ep));

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        isRefreshing = false;
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        // Dispatch event so AuthContext can handle logout cleanly
        window.dispatchEvent(new Event('auth:expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
