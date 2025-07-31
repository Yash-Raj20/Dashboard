import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  Permission,
} from "@shared/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: AuthUser; token: string } }
  | { type: "LOGIN_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "TOKEN_VERIFIED"; payload: { user: AuthUser } }
  | { type: "SET_LOADING"; payload: boolean };

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: string) => boolean;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Safely get token for initial state
const getInitialToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: null,
  token: getInitialToken(),
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case "LOGIN_FAILURE":
    case "LOGOUT":
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case "TOKEN_VERIFIED":
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        dispatch({ type: "LOGIN_FAILURE" });
        return false;
      }

      const data: LoginResponse = await res.json();
      localStorage.setItem("auth_token", data.token);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: data.user, token: data.token },
      });

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      dispatch({ type: "LOGIN_FAILURE" });
      return false;
    }
  };

  const logout = async () => {
    try {
      if (state.token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        });
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      localStorage.removeItem("auth_token");
      dispatch({ type: "LOGOUT" });
    }
  };

  const verifyToken = async (): Promise<boolean> => {
    const token = getInitialToken();

    if (!token) {
      dispatch({ type: "LOGIN_FAILURE" });
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        localStorage.removeItem("auth_token");
        dispatch({ type: "LOGIN_FAILURE" });
        return false;
      }

      const data = await res.json();
      dispatch({
        type: "TOKEN_VERIFIED",
        payload: { user: data.user },
      });

      return true;
    } catch (err: any) {
      if (
        err.name === "AbortError" ||
        err.message?.includes("fetch") ||
        err.message?.includes("NetworkError")
      ) {
        dispatch({ type: "SET_LOADING", payload: false });
        return false;
      }

      localStorage.removeItem("auth_token");
      dispatch({ type: "LOGIN_FAILURE" });
      return false;
    }
  };

  const hasPermission = (permission: Permission) =>
    !!state.user?.permissions?.includes(permission);

  const hasAnyPermission = (permissions: Permission[]) =>
    permissions.some((p) => hasPermission(p));

  const hasRole = (role: string) => state.user?.role === role;

  const clearAuth = () => {
    localStorage.removeItem("auth_token");
    dispatch({ type: "LOGOUT" });
  };

  useEffect(() => {
    const fallback = setTimeout(() => {
      dispatch({ type: "SET_LOADING", payload: false });
    }, 5000);

    verifyToken().finally(() => clearTimeout(fallback));

    return () => clearTimeout(fallback);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        verifyToken,
        hasPermission,
        hasAnyPermission,
        hasRole,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
