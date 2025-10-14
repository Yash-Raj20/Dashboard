import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useState,
} from "react";
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  Permission,
} from "@shared/auth";
import { fetchApi } from "@shared/api";
import { DashboardUser } from "@/pages/Users";
import { Problem } from "@/pages/AllProblems";
import { fetchApiBackend } from "@shared/api";

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
  fetchUsers: () => Promise<void>;
  fetchProblems: () => Promise<void>;
  users: DashboardUser[];
  loading: boolean;
  error: string | null;
  data: Problem[];
  setData: React.Dispatch<React.SetStateAction<Problem[]>>;
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
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = React.useState<Problem[]>([]);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const data: LoginResponse = await fetchApiBackend("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Save token and user
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

  //All Users of Janseva Portal Website
  const fetchUsers = async () => {
    try {
      // check localStorage first
      const cached = localStorage.getItem("users");
      if (cached) {
        setUsers(JSON.parse(cached));
        return;
      }

      const response = await fetchApi("auth/all");
      console.log("Fetched users:", response);

      if (response.users && Array.isArray(response.users)) {
        setUsers(response.users);
        localStorage.setItem("users", JSON.stringify(response.users)); // cache
        setError(null);
      } else {
        setError(response.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Network error while fetching users");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Problems fetch with local cache
  const fetchProblems = async () => {
    setLoading(true);
    try {
      // check localStorage first
      const cached = localStorage.getItem("problems");
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const response = await fetchApi<any[]>("problems");
      const mapped = response.map((p) => ({
        ...p,
        id: p._id,
      }));
      setData(mapped);
      localStorage.setItem("problems", JSON.stringify(mapped)); // cache
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (state.token) {
        await fetchApiBackend("/auth/logout", {
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
      const data = await fetchApiBackend("/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch({
        type: "TOKEN_VERIFIED",
        payload: { user: data.user },
      });

      return true;
    } catch (err: any) {
      console.error("Token verification failed:", err);

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
        fetchUsers,
        fetchProblems,
        hasAnyPermission,
        hasRole,
        clearAuth,
        users,
        loading,
        error,
        data,
        setData,
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
