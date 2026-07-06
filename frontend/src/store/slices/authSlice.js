import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "@/lib/api/auth.api";

// ─── Thunks ────────────────────────────────────────────────────────────────

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

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch (err) {
      // On déconnecte localement même si le serveur échoue
      return rejectWithValue(err.response ?? { message: err.message });
    }
  }
);

/**
 * Hydrate l'état auth au démarrage de l'app via GET /auth/me.
 * Utilise le cookie refresh token pour obtenir un access token si nécessaire.
 */
export const hydrateAuth = createAsyncThunk(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      // On tente d'abord sans token — si le cookie refresh est valide,
      // refreshAccessToken sera appelé automatiquement par api-client
      return await authApi.getMe(null);
    } catch {
      return rejectWithValue(null);
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  accessToken: null,
  isLoading: false,
  isHydrating: true,   // true pendant le check initial de session
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
    // Utilisé par l'event global "auth:logout" (session expirée côté api-client)
    forceLogout(state) {
      state.user = null;
      state.accessToken = null;
      state.error = null;
      state.fieldErrors = null;
    },
    // Met à jour le access token après un refresh silencieux
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, handleFulfilled)
      .addCase(registerUser.rejected, handleRejected);

    // Login
    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, handleFulfilled)
      .addCase(loginUser.rejected, handleRejected);

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => { state.isLoading = true; })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.error = null;
        state.fieldErrors = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Déconnexion locale même en cas d'erreur serveur
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
      });

    // Hydrate (vérification session au démarrage)
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.isHydrating = true;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.isHydrating = false;
        state.user = action.payload.data.user;
        // Le token sera stocké en mémoire via un refresh automatique si besoin
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.isHydrating = false;
        state.user = null;
        state.accessToken = null;
      });
  },
});

export const { clearErrors, forceLogout, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
