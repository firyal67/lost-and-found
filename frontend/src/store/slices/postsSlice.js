import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { postsApi } from "@/lib/api/posts.api";

// ─── Thunks ────────────────────────────────────────────────────────────────

export const createPost = createAsyncThunk(
  "posts/create",
  async ({ payload, token }, { rejectWithValue }) => {
    try {
      return await postsApi.createPost(payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response ?? { message: err.message ?? "Network error." }
      );
    }
  }
);

export const fetchMatchingSuggestions = createAsyncThunk(
  "posts/fetchMatchingSuggestions",
  async ({ type, objectType, city, delegation, date, title, description }, { rejectWithValue }) => {
    try {
      if (!objectType) return { data: { suggestions: [] } };
      return await postsApi.getMatchingSuggestions({
        type, objectType, city, delegation, date, title, description,
      });
    } catch (err) {
      return { data: { suggestions: [] } };
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const initialState = {
  createdPost:          null,
  isLoading:            false,
  error:                null,
  fieldErrors:          null,
  // Matching suggestions
  suggestions:          [],
  isFetchingSuggestions: false,
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearPostErrors(state) {
      state.error      = null;
      state.fieldErrors = null;
    },
    clearCreatedPost(state) {
      state.createdPost = null;
    },
    clearSuggestions(state) {
      state.suggestions          = [];
      state.isFetchingSuggestions = false;
    },
  },
  extraReducers: (builder) => {
    // ── Create post ──────────────────────────────────────────────────────────
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading   = true;
        state.error       = null;
        state.fieldErrors = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading  = false;
        state.createdPost = action.payload.data.post;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading   = false;
        state.error       = action.payload?.message || "Une erreur est survenue.";
        state.fieldErrors = action.payload?.errors  || null;
      });

    // ── Matching suggestions ─────────────────────────────────────────────────
    builder
      .addCase(fetchMatchingSuggestions.pending, (state) => {
        state.isFetchingSuggestions = true;
      })
      .addCase(fetchMatchingSuggestions.fulfilled, (state, action) => {
        state.isFetchingSuggestions = false;
        state.suggestions = action.payload?.data?.suggestions ?? [];
      })
      .addCase(fetchMatchingSuggestions.rejected, (state) => {
        state.isFetchingSuggestions = false;
        state.suggestions = [];
      });
  },
});

export const { clearPostErrors, clearCreatedPost, clearSuggestions } = postsSlice.actions;
export default postsSlice.reducer;
