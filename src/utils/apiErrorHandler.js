import toast from 'react-hot-toast';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';

// API Error Handler Utility
export class ApiErrorHandler {
  static handle(error, showToast = true) {
    const errorInfo = this.parseError(error);
    
    if (showToast && !errorInfo.silent) {
      toast.error(errorInfo.message);
    }
    
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', errorInfo);
    }
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production' && errorInfo.shouldReport) {
      this.reportError(errorInfo);
    }
    
    return errorInfo;
  }
  
  static parseError(error) {
    // Default error info
    let errorInfo = {
      message: ERROR_MESSAGES.GENERIC_ERROR,
      status: null,
      code: null,
      data: null,
      silent: false,
      shouldReport: true,
      type: 'unknown'
    };
    
    // No error object
    if (!error) {
      return { ...errorInfo, message: 'Unknown error occurred' };
    }
    
    // Network error (no response)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          ...errorInfo,
          message: 'Request timeout. Please try again.',
          type: 'timeout',
          shouldReport: false
        };
      }
      
      return {
        ...errorInfo,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: 'network',
        shouldReport: false
      };
    }
    
    // HTTP Response error
    const { response } = error;
    const status = response.status;
    const data = response.data;
    
    errorInfo.status = status;
    errorInfo.data = data;
    
    // Extract error message from response
    let message = ERROR_MESSAGES.GENERIC_ERROR;
    if (data) {
      if (typeof data === 'string') {
        message = data;
      } else if (data.error) {
        message = data.error;
      } else if (data.message) {
        message = data.message;
      } else if (data.errors && Array.isArray(data.errors)) {
        message = data.errors.join(', ');
      }
    }
    
    // Handle specific status codes
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return {
          ...errorInfo,
          message: message || 'Invalid request. Please check your input.',
          type: 'validation',
          shouldReport: false
        };
        
      case HTTP_STATUS.UNAUTHORIZED:
        return {
          ...errorInfo,
          message: ERROR_MESSAGES.UNAUTHORIZED,
          type: 'auth',
          shouldReport: false
        };
        
      case HTTP_STATUS.FORBIDDEN:
        return {
          ...errorInfo,
          message: 'You do not have permission to perform this action.',
          type: 'permission',
          shouldReport: false
        };
        
      case HTTP_STATUS.NOT_FOUND:
        return {
          ...errorInfo,
          message: message || 'The requested resource was not found.',
          type: 'not_found',
          silent: true, // Don't show toast for 404s by default
          shouldReport: false
        };
        
      case HTTP_STATUS.CONFLICT:
        return {
          ...errorInfo,
          message: message || 'A conflict occurred. The resource may already exist.',
          type: 'conflict',
          shouldReport: false
        };
        
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return {
          ...errorInfo,
          message: message || 'Validation failed. Please check your input.',
          type: 'validation',
          shouldReport: false
        };
        
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return {
          ...errorInfo,
          message: 'Too many requests. Please wait a moment and try again.',
          type: 'rate_limit',
          shouldReport: false
        };
        
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return {
          ...errorInfo,
          message: 'Server error. Please try again later.',
          type: 'server_error',
          shouldReport: true
        };
        
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return {
          ...errorInfo,
          message: 'Service temporarily unavailable. Please try again later.',
          type: 'service_unavailable',
          shouldReport: false
        };
        
      default:
        return {
          ...errorInfo,
          message: message || `HTTP ${status}: ${response.statusText || 'Unknown error'}`,
          type: 'http_error'
        };
    }
  }
  
  static reportError(errorInfo) {
    // In a real application, you would send this to your error reporting service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    try {
      // Example implementation
      const errorReport = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        error: {
          message: errorInfo.message,
          status: errorInfo.status,
          type: errorInfo.type,
          data: errorInfo.data
        }
      };
      
      // Send to monitoring service
      console.log('Would report error:', errorReport);
      
      // Example: Sentry
      // Sentry.captureException(new Error(errorInfo.message), {
      //   contexts: { errorInfo },
      //   tags: { type: errorInfo.type },
      // });
      
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }
  
  static getCurrentUserId() {
    try {
      // Get user ID from localStorage or context
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }
  
  static getSessionId() {
    try {
      return localStorage.getItem('sessionId') || null;
    } catch {
      return null;
    }
  }
}

// Convenience functions
export const handleApiError = (error, showToast = true) => {
  return ApiErrorHandler.handle(error, showToast);
};

export const isNetworkError = (error) => {
  const errorInfo = ApiErrorHandler.parseError(error);
  return errorInfo.type === 'network' || errorInfo.type === 'timeout';
};

export const isAuthError = (error) => {
  const errorInfo = ApiErrorHandler.parseError(error);
  return errorInfo.type === 'auth' && errorInfo.status === HTTP_STATUS.UNAUTHORIZED;
};

export const isValidationError = (error) => {
  const errorInfo = ApiErrorHandler.parseError(error);
  return errorInfo.type === 'validation';
};

export const isNotFoundError = (error) => {
  const errorInfo = ApiErrorHandler.parseError(error);
  return errorInfo.type === 'not_found';
};

export const isRateLimitError = (error) => {
  const errorInfo = ApiErrorHandler.parseError(error);
  return errorInfo.type === 'rate_limit';
};

export const shouldRetry = (error) => {
  const errorInfo = ApiErrorHandler.parseError(error);
  
  // Retry on network errors and specific server errors
  return (
    errorInfo.type === 'network' ||
    errorInfo.type === 'timeout' ||
    errorInfo.status === HTTP_STATUS.INTERNAL_SERVER_ERROR ||
    errorInfo.status === HTTP_STATUS.SERVICE_UNAVAILABLE
  );
};

// Retry utility with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export default ApiErrorHandler;
