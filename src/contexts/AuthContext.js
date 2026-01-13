import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Debug function
const debugState = (action, state) => {
  console.log(`🔍 AUTH DEBUG [${action}]:`, {
    user: state.user?.email || null,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasTokenInStorage: !!localStorage.getItem('accessToken')
  });
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_ERROR: 'REGISTER_ERROR',
  LOAD_USER: 'LOAD_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      newState = {
        ...state,
        isLoading: true,
        error: null,
      };
      break;

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      newState = {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      break;

    case AUTH_ACTIONS.LOGIN_ERROR:
    case AUTH_ACTIONS.REGISTER_ERROR:
      newState = {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
      break;

    case AUTH_ACTIONS.LOGOUT:
      newState = {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
      break;

    case AUTH_ACTIONS.LOAD_USER:
      newState = {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
      break;

    case AUTH_ACTIONS.SET_LOADING:
      newState = {
        ...state,
        isLoading: action.payload,
      };
      break;

    case AUTH_ACTIONS.CLEAR_ERROR:
      newState = {
        ...state,
        error: null,
      };
      break;

    case AUTH_ACTIONS.UPDATE_USER:
      newState = {
        ...state,
        user: action.payload,
      };
      break;

    default:
      newState = state;
  }
  
  debugState(action.type, newState);
  return newState;
};

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from localStorage and validate token
  const loadUser = async () => {
    console.log('🚀 LOADUSER STARTED');
    
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('Tokens check:', {
      hasAccessToken: !!token,
      hasRefreshToken: !!refreshToken
    });
    
    if (!token) {
      console.log('LoadUser - No token, user not authenticated');
      dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: null });
      return;
    }

    // If we have a token, assume user is authenticated until proven otherwise
    console.log('LoadUser - Token exists, assuming authenticated and verifying...');
    
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      // Verify token with server
      console.log('LoadUser - Verifying token with server...');
      const response = await authService.getCurrentUser();
      console.log('LoadUser - Server verification successful');
      console.log('LoadUser - Full response:', response);
      console.log('LoadUser - Response data:', response.data);
      console.log('LoadUser - Response structure check:', {
        hasData: !!response.data,
        hasUser: !!(response.data && response.data.user),
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      });
      
      // Try multiple possible response structures
      let user = null;
      if (response.data && response.data.user) {
        user = response.data.user;
        console.log('LoadUser - Found user in response.data.user');
      } else if (response.data && response.data.data && response.data.data.user) {
        user = response.data.data.user;
        console.log('LoadUser - Found user in response.data.data.user');
      } else if (response.data) {
        user = response.data;
        console.log('LoadUser - Using response.data directly as user');
      }
      
      if (user && (user.email || user._id)) {
        dispatch({ 
          type: AUTH_ACTIONS.LOAD_USER, 
          payload: user 
        });
        console.log('LoadUser - ✅ User verified:', user.email || user._id);
      } else {
        console.log('LoadUser - Invalid response structure, clearing auth');
        console.log('LoadUser - Expected user object with email or _id, got:', user);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: null });
      }
    } catch (error) {
      console.log('🚨 LOADUSER ERROR:', error.message);
      console.log('Error details:', {
        status: error.response?.status,
        code: error.code,
        message: error.message
      });
      
      // Only clear authentication for actual auth errors (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🔐 Token invalid/expired, clearing auth');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: null });
      } else {
        console.log('🌐 Network/Server error - keeping auth state (tokens preserved)');
        // For network errors: assume user is still authenticated
        // Create a minimal user object to maintain auth state
        const fallbackUser = { 
          email: 'offline_user', 
          _id: 'offline', 
          firstName: 'User',
          role: 'Creator'
        };
        dispatch({ 
          type: AUTH_ACTIONS.LOAD_USER, 
          payload: fallbackUser 
        });
      }
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      console.log('🏁 LOADUSER FINISHED');
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authService.login(credentials);
      const { user, tokens } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_SUCCESS, 
        payload: { user } 
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_ERROR, 
        payload: errorMessage 
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await authService.register(userData);
      const { user, tokens } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      dispatch({ 
        type: AUTH_ACTIONS.REGISTER_SUCCESS, 
        payload: { user } 
      });

      toast.success('Registration successful! Welcome to Pluto!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ 
        type: AUTH_ACTIONS.REGISTER_ERROR, 
        payload: errorMessage 
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({ 
      type: AUTH_ACTIONS.UPDATE_USER, 
      payload: { ...state.user, ...userData } 
    });
  };

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!state.user) return false;
    if (!requiredRole) return true;
    return state.user.role === requiredRole;
  };

  // Check if user can perform action
  const canPerformAction = (action, resource = null) => {
    if (!state.user) return false;

    switch (action) {
      case 'upload':
        return state.user.role === 'Creator';
      case 'edit':
      case 'delete':
        if (!resource) return false;
        return resource.creatorId === state.user._id || state.user.role === 'Admin';
      case 'comment':
        return true; // All authenticated users can comment
      default:
        return false;
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    canPerformAction,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
