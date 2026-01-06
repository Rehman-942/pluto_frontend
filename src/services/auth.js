import { apiService } from './api';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData);
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials);
    return response;
  },

  // Logout user
  logout: async () => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiService.get('/auth/me');
    return response;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await apiService.post('/auth/refresh', { refreshToken });
    return response;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiService.put('/auth/change-password', passwordData);
    return response;
  },

  // Request password reset
  forgotPassword: async (email) => {
    const response = await apiService.post('/auth/forgot-password', { email });
    return response;
  },

  // Get auth stats (admin only)
  getAuthStats: async () => {
    const response = await apiService.get('/auth/stats');
    return response;
  },
};
