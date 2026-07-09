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

// ─── Slice ─────────────────────────────────────────────────────────────────

const initialState = {
  // Annonce tout juste créée (utilisée pour la redirection post-submit)
  createdPost: null,
  isLoading: false,
  error: null,
  fieldErrors: null,
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearPostErrors(state) {
      state.error = null;
      state.fieldErrors = null;
    },
    clearCreatedPost(state) {
      state.createdPost = null;
    },
  },
  extraReducers: (builder) => {
    // Create post
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.fieldErrors = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.createdPost = action.payload.data.post;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Une erreur est survenue.";
        state.fieldErrors = action.payload?.errors || null;
      });
  },
});

export const { clearPostErrors, clearCreatedPost } = postsSlice.actions;
export default postsSlice.reducer;
