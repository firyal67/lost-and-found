import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "@/lib/api/auth.api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
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

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.register(payload);
      return data;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string; errors?: { field: string; message: string }[] } };
        };
        return rejectWithValue(axiosErr.response?.data);
      }
      return rejectWithValue({ message: "Network error. Please try again." });
    }
  }
);

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
  fieldErrors: null,
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
    setCredentials(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.fieldErrors = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as {
          message?: string;
          errors?: { field: string; message: string }[];
        };
        state.error = payload?.message || "Registration failed.";
        state.fieldErrors = payload?.errors || null;
      });
  },
});

export const { clearErrors, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
