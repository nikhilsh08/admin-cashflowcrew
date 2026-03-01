// @/_authContext/slice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

// Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
  isAdmin: boolean;
}

interface AdminCredentials {
  email: string;
  password: string;
}

interface AdminState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loader: boolean;
  error: string | null;
}

// Redux Store Type
export interface RootState {
  admin: AdminState;
}

// Dispatch Type
export type AppDispatch = any;

// ✅ Initialize axios headers if token exists in cookies on app load
const initializeAuthHeaders = () => {
  const token = Cookies.get("authjs.csrf-token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios.defaults.withCredentials = true;
    localStorage.setItem("authjs.csrf-token", token);
  }
};

// Call this immediately when module loads
initializeAuthHeaders();

const initialState: AdminState = {
  user: null,
  isAuthenticated: false,
  loader: false,
  error: null,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loader = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<AdminUser>) => {
      state.loader = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loader = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.loader = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;

      // remove token from cookies
      Cookies.remove("authjs.csrf-token");
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("authjs.csrf-token");
    },
    clearError: (state) => {
      state.error = null;
    },
    // ✅ Add action to set initial auth state
    setInitialAuth: (state) => {
      const token = Cookies.get("authjs.csrf-token");
      if (token) {
        state.loader = true; // Show loading while verifying
      }
    },
  },
});

// Async thunk for login
export const loginAdmin =
  (credentials: AdminCredentials) => async (dispatch: AppDispatch): Promise<void> => {
    dispatch(loginStart());

    try {
      // Step 1: check if admin
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/admin/is-admin`,
        { email: credentials.email },
        { withCredentials: true }
      );

      // Step 2: login request
      const loginResponse = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/login`,
        credentials,
        { withCredentials: true }
      );

      const userData = loginResponse.data;
      console.log("userData:", userData);

      const adminUser: AdminUser = {
        id: userData.user._id,
        email: userData.user.email,
        name: `${userData.user.firstName ?? ""} ${userData.user.lastName ?? ""}`,
        firstName: userData.user.firstName,
        lastName: userData.user.lastName,
        role: userData.user.role,
        isAdmin: userData.user.isAdmin,
        permissions: userData.user.isAdmin
          ? ["read", "write", "delete"]
          : ["read"],
      };

      dispatch(loginSuccess(adminUser));
      axios.defaults.withCredentials = true;


    } catch (err: any) {
      console.error("Login error:", err.response?.data || err.message);
      dispatch(
        loginFailure(
          err.response?.data?.message || "Login failed. Please try again."
        )
      );
    }
  };

// Check if admin is already logged in
export const checkAdminAuth =
  () => async (dispatch: AppDispatch): Promise<void> => {
    const token = Cookies.get("authjs.csrf-token");

    if (!token) {
      dispatch(loginFailure("No token found"));
      return;
    }

    dispatch(loginStart());

    // ✅ Ensure axios headers are set
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios.defaults.withCredentials = true;
    localStorage.setItem("authjs.csrf-token", token);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/admin/verify`,
        { withCredentials: true }
      );

      const userData = response.data;

      const adminUser: AdminUser = {
        id: userData.user._id,
        email: userData.user.email,
        name: `${userData.user.firstName ?? ""} ${userData.user.lastName ?? ""}`,
        firstName: userData.user.firstName,
        lastName: userData.user.lastName,
        role: userData.user.role,
        isAdmin: userData.user.isAdmin,
        permissions: userData.user.isAdmin
          ? ["read", "write", "delete"]
          : ["read"],
      };

      dispatch(loginSuccess(adminUser));
    } catch (err: any) {
      console.error("Auth check failed:", err.response?.data || err.message);
      Cookies.remove("authjs.csrf-token");
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("authjs.csrf-token");
      dispatch(loginFailure("Session expired. Please login again."));
    }
  };

export const { loginStart, loginSuccess, loginFailure, logout, clearError, setInitialAuth } =
  adminSlice.actions;

export default adminSlice.reducer;