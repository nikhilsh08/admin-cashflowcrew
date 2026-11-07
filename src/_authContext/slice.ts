// @/_authContext/slice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import axios from "axios";

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
  // true once the initial session check has resolved, so route guards can
  // tell "not logged in" apart from "still checking"
  authChecked: boolean;
}

// Redux Store Type
export interface RootState {
  admin: AdminState;
}

// Dispatch Type
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

interface SessionUser {
  id?: string;
  _id?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface RequestError {
  response?: { status?: number; data?: { error?: string; message?: string } };
  config?: { url?: string };
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const initialState: AdminState = {
  user: null,
  isAuthenticated: false,
  loader: false,
  error: null,
  authChecked: false,
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
      state.authChecked = true;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loader = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
      state.authChecked = true;
    },
    logout: (state) => {
      state.loader = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.authChecked = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

const toAdminUser = (user: SessionUser): AdminUser => ({
  id: user.id ?? user._id ?? "",
  email: user.email,
  name: user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  isAdmin: true,
  permissions: ["read", "write", "delete"],
});

// The NextAuth session cookie is sent automatically (withCredentials); the
// server re-checks the admin role on every call.
export const fetchAdminSession = async (): Promise<AdminUser> => {
  const response = await axios.get(`${SERVER_URL}/api/admin/session`, {
    withCredentials: true,
  });
  return toAdminUser(response.data.user);
};

export const loginAdmin =
  (credentials: AdminCredentials) => async (dispatch: AppDispatch): Promise<void> => {
    dispatch(loginStart());

    try {
      await axios.post(`${SERVER_URL}/api/auth/login`, credentials, {
        withCredentials: true,
      });

      // /api/auth/login signs in any user; the session endpoint is what
      // proves the admin role.
      const adminUser = await fetchAdminSession();
      dispatch(loginSuccess(adminUser));
    } catch (error) {
      const err = error as RequestError;
      const status = err.response?.status;
      const url = err.config?.url ?? "";
      const message =
        status === 401 && url.endsWith("/api/admin/session")
          ? "This account does not have admin access."
          : err.response?.data?.error ||
            err.response?.data?.message ||
            "Login failed. Please try again.";
      dispatch(loginFailure(message));
    }
  };

// Restore the session on page load / refresh.
export const checkAdminAuth =
  () => async (dispatch: AppDispatch): Promise<void> => {
    dispatch(loginStart());

    try {
      dispatch(loginSuccess(await fetchAdminSession()));
    } catch {
      // Not logged in is the normal cold-start state, not an error to show.
      dispatch(loginFailure(""));
    }
  };

export const { loginStart, loginSuccess, loginFailure, logout, clearError } =
  adminSlice.actions;

export default adminSlice.reducer;
