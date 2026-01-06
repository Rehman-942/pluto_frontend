import { apiService } from './api';

export const userService = {
  // Get all users with search and filtering
  getUsers: async (params = {}) => {
    const response = await apiService.get('/users', params, { useCache: true });
    return response;
  },

  // Get single user profile
  getUser: async (id) => {
    const response = await apiService.get(`/users/${id}`, {}, { useCache: true });
    return response;
  },

  // Update user profile
  updateUser: async (id, userData) => {
    const response = await apiService.put(`/users/${id}`, userData);
    
    // Clear user cache
    apiService.invalidateCache(`/users/${id}`);
    
    return response;
  },

  // Upload user avatar
  uploadAvatar: async (id, formData, onProgress = null) => {
    const response = await apiService.uploadFile(`/users/${id}/avatar`, formData, onProgress);
    
    // Clear user cache
    apiService.invalidateCache(`/users/${id}`);
    
    return response;
  },

  // Delete user avatar
  deleteAvatar: async (id) => {
    const response = await apiService.delete(`/users/${id}/avatar`);
    
    // Clear user cache
    apiService.invalidateCache(`/users/${id}`);
    
    return response;
  },

  // Get user statistics
  getUserStats: async (id) => {
    const response = await apiService.get(`/users/${id}/stats`, {}, { useCache: true });
    return response;
  },

  // Follow/unfollow user
  followUser: async (id) => {
    const response = await apiService.post(`/users/${id}/follow`);
    
    // Clear user cache to update follower counts
    apiService.invalidateCache(`/users/${id}`);
    
    return response;
  },

  // Search users
  searchUsers: async (query, params = {}) => {
    const response = await apiService.get(`/users/search/${encodeURIComponent(query)}`, params, { useCache: true });
    return response;
  },

  // Deactivate user account
  deactivateAccount: async (id) => {
    const response = await apiService.delete(`/users/${id}`);
    
    // Clear user cache
    apiService.invalidateCache(`/users/${id}`);
    apiService.clearCache('/users');
    
    return response;
  },

  // Get user by username
  getUserByUsername: async (username) => {
    const response = await apiService.get('/users', { search: username }, { useCache: true });
    return response;
  },
};
