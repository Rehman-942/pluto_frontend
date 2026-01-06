import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        setTokens(accessToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.error) {
      const errorMessage = error.response.data.error;
      
      // Don't show toast for certain errors that are handled by components
      const silentErrors = ['Photo not found', 'User not found', 'Resource not found'];
      if (!silentErrors.some(msg => errorMessage.includes(msg))) {
        toast.error(errorMessage);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Cache for storing responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
const getCacheKey = (url, params) => {
  return `${url}_${JSON.stringify(params)}`;
};

const getCachedResponse = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedResponse = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// API methods with caching
export const apiService = {
  // Generic methods
  get: async (url, params = {}, options = {}) => {
    const { useCache = false, cacheKey } = options;
    const key = cacheKey || getCacheKey(url, params);

    if (useCache) {
      const cached = getCachedResponse(key);
      if (cached) {
        return cached;
      }
    }

    const response = await api.get(url, { params });
    
    if (useCache) {
      setCachedResponse(key, response);
    }

    return response;
  },

  post: async (url, data, config = {}) => {
    return api.post(url, data, config);
  },

  put: async (url, data, config = {}) => {
    return api.put(url, data, config);
  },

  delete: async (url, config = {}) => {
    return api.delete(url, config);
  },

  // File upload with progress
  uploadFile: async (url, formData, onProgress = null) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    return api.post(url, formData, config);
  },

  // Clear cache methods
  clearCache: (pattern = null) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  },

  invalidateCache: (keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => cache.delete(key));
    } else {
      cache.delete(keys);
    }
  },
};

// Export configured axios instance for direct use
export default api;
