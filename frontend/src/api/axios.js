import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Plain instance used for the refresh call itself (avoid interceptor loops)
const rawAxios = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refreshToken cookie
});

// Main instance used by the rest of the app
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// In-memory store for the access token (NOT localStorage - avoids XSS token theft)
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Attach the access token to every outgoing request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// If a request comes back 401 (expired access token), try to refresh once, then retry
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, originalRequest });
        });
      }

      isRefreshing = true;

      try {
        const res = await rawAxios.post('/api/auth/refresh');
        const newToken = res.data.accessToken;
        setAccessToken(newToken);

        // Retry queued requests with the new token
        refreshQueue.forEach(({ resolve, originalRequest: req }) => {
          req.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(req));
        });
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        setAccessToken(null);
        // Let the app redirect to login - handled in AuthContext/ProtectedRoute
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { rawAxios };
export default api;