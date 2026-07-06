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
};
