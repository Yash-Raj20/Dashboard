import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthUser, LoginRequest, LoginResponse, Permission } from '@shared/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_VERIFIED'; payload: { user: AuthUser } }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'TOKEN_VERIFIED':
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        dispatch({ type: 'LOGIN_FAILURE' });
        return false;
      }

      const data: LoginResponse = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          token: data.token,
        },
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout API if token exists
      if (state.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('auth_token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const verifyToken = async (): Promise<boolean> => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('auth_token');
        dispatch({ type: 'LOGIN_FAILURE' });
        return false;
      }

      const data = await response.json();
      dispatch({
        type: 'TOKEN_VERIFIED',
        payload: {
          user: data.user,
        },
      });

      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('auth_token');
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return state.user?.permissions.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasRole = (role: string): boolean => {
    return state.user?.role === role;
  };

  // Verify token on mount
  useEffect(() => {
    verifyToken();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    verifyToken,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
