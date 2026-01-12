// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  VIDEOS: {
    LIST: '/videos',
    TRENDING: '/videos/trending',
    DETAIL: (id) => `/videos/${id}`,
    USER: (userId) => `/videos/user/${userId}`,
    LIKE: (id) => `/videos/${id}/like`,
    VIEW: (id) => `/videos/${id}/view`,
    UPLOAD: '/videos',
    UPDATE: (id) => `/videos/${id}`,
    DELETE: (id) => `/videos/${id}`,
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    AVATAR: (id) => `/users/${id}/avatar`,
    STATS: (id) => `/users/${id}/stats`,
    FOLLOW: (id) => `/users/${id}/follow`,
    SEARCH: (query) => `/users/search/${encodeURIComponent(query)}`,
  },
  COMMENTS: {
    VIDEO: (videoId) => `/comments/video/${videoId}`,
    THREAD: (commentId) => `/comments/${commentId}/thread`,
    CREATE: '/comments',
    UPDATE: (id) => `/comments/${id}`,
    DELETE: (id) => `/comments/${id}`,
    LIKE: (id) => `/comments/${id}/like`,
    REPORT: (id) => `/comments/${id}/report`,
    USER: (userId) => `/comments/user/${userId}`,
  },
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Pluto',
  VERSION: '1.0.0',
  DESCRIPTION: 'A modern video sharing platform',
  AUTHOR: 'Pluto Team',
  GITHUB_URL: 'https://github.com/pluto/pluto',
  SUPPORT_EMAIL: 'support@pluto.com',
};

// File Upload Limits
export const UPLOAD_LIMITS = {
  VIDEO: {
    MAX_SIZE: 500 * 1024 * 1024, // 500MB
    ALLOWED_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/m4v'],
    ALLOWED_EXTENSIONS: ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v'],
  },
  AVATAR: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
  },
};

// User Roles and Permissions
export const USER_ROLES = {
  ADMIN: 'Admin',
  CREATOR: 'Creator',
  CONSUMER: 'Consumer',
};

export const PERMISSIONS = {
  UPLOAD_VIDEOS: [USER_ROLES.CREATOR],
  EDIT_VIDEOS: [USER_ROLES.CREATOR],
  DELETE_VIDEOS: [USER_ROLES.CREATOR, USER_ROLES.ADMIN],
  MODERATE_COMMENTS: [USER_ROLES.ADMIN],
  VIEW_ANALYTICS: [USER_ROLES.CREATOR, USER_ROLES.ADMIN],
};

// Video Visibility Options
export const VIDEO_VISIBILITY = {
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
  PRIVATE: 'private',
};

export const VISIBILITY_OPTIONS = [
  { value: VIDEO_VISIBILITY.PUBLIC, label: 'Public', description: 'Anyone can see this video' },
  { value: VIDEO_VISIBILITY.UNLISTED, label: 'Unlisted', description: 'Only people with the link can see this video' },
  { value: VIDEO_VISIBILITY.PRIVATE, label: 'Private', description: 'Only you can see this video' },
];

// Sorting and Filtering Options
export const SORT_OPTIONS = {
  LATEST: { value: 'createdAt', order: 'desc', label: 'Latest' },
  OLDEST: { value: 'createdAt', order: 'asc', label: 'Oldest' },
  MOST_LIKED: { value: 'likesCount', order: 'desc', label: 'Most Liked' },
  MOST_VIEWED: { value: 'viewsCount', order: 'desc', label: 'Most Viewed' },
  TITLE_AZ: { value: 'title', order: 'asc', label: 'Title A-Z' },
  TITLE_ZA: { value: 'title', order: 'desc', label: 'Title Z-A' },
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  INFINITE_SCROLL_THRESHOLD: 100, // pixels from bottom
};

// Cache Configuration
export const CACHE_KEYS = {
  USER_PROFILE: 'userProfile',
  USER_PREFERENCES: 'userPreferences',
  SEARCH_HISTORY: 'searchHistory',
  DRAFT_VIDEOS: 'draftVideos',
  THEME_MODE: 'themeMode',
  LANGUAGE: 'language',
};

export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    RESERVED: ['admin', 'root', 'api', 'www', 'mail', 'support', 'help', 'info'],
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: false,
    REQUIRE_SYMBOLS: false,
  },
  VIDEO: {
    TITLE: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 200,
    },
    DESCRIPTION: {
      MAX_LENGTH: 1000,
    },
    TAGS: {
      MAX_COUNT: 10,
      MAX_LENGTH: 30,
    },
  },
  COMMENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
};

// UI Constants
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
};

export const GRID_COLUMNS = {
  XS: 1,
  SM: 2,
  MD: 3,
  LG: 4,
  XL: 5,
};

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1',
};

// Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  FILE_TOO_LARGE: 'File size is too large.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  UPLOAD_FAILED: 'Upload failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  LOGOUT: 'Logged out successfully',
  REGISTRATION: 'Registration successful! Welcome to Pluto!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  VIDEO_UPLOADED: 'Video uploaded successfully!',
  VIDEO_UPDATED: 'Video updated successfully!',
  VIDEO_DELETED: 'Video deleted successfully',
  COMMENT_ADDED: 'Comment added successfully',
  LIKE_ADDED: 'Video liked!',
  LIKE_REMOVED: 'Video unliked',
};

// ... (rest of the code remains the same)
// Social Media Links
export const SOCIAL_PLATFORMS = {
  INSTAGRAM: {
    name: 'Instagram',
    baseUrl: 'https://instagram.com/',
    icon: 'Instagram',
  },
  TWITTER: {
    name: 'Twitter',
    baseUrl: 'https://twitter.com/',
    icon: 'Twitter',
  },
  FACEBOOK: {
    name: 'Facebook',
    baseUrl: 'https://facebook.com/',
    icon: 'Facebook',
  },
  LINKEDIN: {
    name: 'LinkedIn',
    baseUrl: 'https://linkedin.com/in/',
    icon: 'LinkedIn',
  },
};

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  HASHTAG: /#[a-zA-Z0-9_]+/g,
  MENTION: /@[a-zA-Z0-9_]+/g,
};

// Feature Flags (can be controlled via environment variables)
export const FEATURES = {
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  SOCIAL_LOGIN: process.env.REACT_APP_ENABLE_SOCIAL_LOGIN === 'true',
  PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH_NOTIFICATIONS === 'true',
  ADVANCED_SEARCH: process.env.REACT_APP_ENABLE_ADVANCED_SEARCH === 'true',
  REAL_TIME_UPDATES: process.env.REACT_APP_ENABLE_REAL_TIME === 'true',
};

export default {
  API_ENDPOINTS,
  APP_CONFIG,
  UPLOAD_LIMITS,
  USER_ROLES,
  PERMISSIONS,
  VIDEO_VISIBILITY,
  VISIBILITY_OPTIONS,
  SORT_OPTIONS,
  PAGINATION,
  CACHE_KEYS,
  CACHE_DURATION,
  VALIDATION_RULES,
  BREAKPOINTS,
  GRID_COLUMNS,
  THEME_COLORS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SOCIAL_PLATFORMS,
  REGEX,
  FEATURES,
};
