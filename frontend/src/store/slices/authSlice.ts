import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authApi, RegisterPayload, LoginPayload } from "@/lib/api/auth.api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  fieldErrors: { field: string; message: string }[] | null;
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (err: unknown) {
      const e = err as { response?: unknown; message?: string };
      return rejectWithValue(e.response ?? { message: e.message ?? "Network error." });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      return await authApi.login(payload);
    } catch (err: unknown) {
      const e = err as { response?: unknown; message?: string };
      return rejectWithValue(e.response ?? { message: e.message ?? "Network error." });
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
  fieldErrors: null,
};

const handlePending = (state: AuthState) => {
  state.isLoading = true;
  state.error = null;
  state.fieldErrors = null;
};

const handleFulfilled = (state: AuthState, action: PayloadAction<{ data: { user: User; accessToken: string } }>) => {
  state.isLoading = false;
  state.user = action.payload.data.user;
  state.accessToken = action.payload.data.accessToken;
};

const handleRejected = (state: AuthState, action: PayloadAction<unknown>) => {
  state.isLoading = false;
  const payload = action.payload as { message?: string; errors?: { field: string; message: string }[] };
  state.error = payload?.message || "Something went wrong.";
  state.fieldErrors = payload?.errors || null;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearErrors(state) {
      state.error = null;
      state.fieldErrors = null;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.error = null;
      state.fieldErrors = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, handleFulfilled)
      .addCase(registerUser.rejected, handleRejected)
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, handleFulfilled)
      .addCase(loginUser.rejected, handleRejected);
  },
});

export const { clearErrors, logout } = authSlice.actions;
export default authSlice.reducer;
