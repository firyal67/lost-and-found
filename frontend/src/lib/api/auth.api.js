import apiFetch from "@/lib/api-client";

export const authApi = {
  register: async (payload) => {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login: async (payload) => {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logout: async () => {
    return apiFetch("/auth/logout", { method: "POST" });
  },
  getMe: async (token) => {
    return apiFetch("/auth/me", { token });
  },
  forgotPassword: async (payload) => {
    return apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  resetPassword: async ({ token, password, confirmPassword }) => {
    return apiFetch(`/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify({ password, confirmPassword }),
    });
  },
};
