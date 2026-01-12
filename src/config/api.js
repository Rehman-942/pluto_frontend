// API Configuration for Pluto Frontend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiConfig = {
  // Base URL for API calls
  baseUrl: API_BASE_URL,
  
  // API endpoints (with /api prefix)
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout'
    },
    users: {
      profile: '/api/users/profile',
      update: '/api/users/update'
    },
    videos: {
      upload: '/api/videos/upload',
      list: '/api/videos',
      like: '/api/videos/like',
      comment: '/api/videos/comment',
      delete: '/api/videos/delete'
    },
    comments: {
      add: '/api/comments',
      delete: '/api/comments/delete'
    }
  },
  
  // Configuration options
  timeout: 10000,
  retries: 3,
  
  // Helper function to get full URL
  getUrl: (endpoint) => `${API_BASE_URL}${endpoint}`
};

export default apiConfig;
