import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "@/lib/api/auth.api";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (err) {
      return rejectWithValue(err.response ?? { message: err.message ?? "Network error." });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.login(payload);
    } catch (err) {
      return rejectWithValue(err.response ?? { message: err.message ?? "Network error." });
    }
  }
);

const initialState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
  fieldErrors: null,
};

const handlePending = (state) => {
  state.isLoading = true;
  state.error = null;
  state.fieldErrors = null;
};

const handleFulfilled = (state, action) => {
  state.isLoading = false;
  state.user = action.payload.data.user;
  state.accessToken = action.payload.data.accessToken;
};

const handleRejected = (state, action) => {
  state.isLoading = false;
  state.error = action.payload?.message || "Something went wrong.";
  state.fieldErrors = action.payload?.errors || null;
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
