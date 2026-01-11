// API Configuration for Pluto Frontend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiConfig = {
  // Base URL for API calls
  baseUrl: API_BASE_URL,
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      refresh: '/auth/refresh',
      logout: '/auth/logout'
    },
    users: {
      profile: '/users/profile',
      update: '/users/update'
    },
    videos: {
      upload: '/videos/upload',
      list: '/videos',
      like: '/videos/like',
      comment: '/videos/comment',
      delete: '/videos/delete'
    },
    comments: {
      add: '/comments',
      delete: '/comments/delete'
    }
  },
  
  // Configuration options
  timeout: 10000,
  retries: 3,
  
  // Helper function to get full URL
  getUrl: (endpoint) => `${API_BASE_URL}${endpoint}`
};

export default apiConfig;
