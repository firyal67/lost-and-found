import apiFetch from "@@/lib/api-clientient";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login: async (payload: LoginPayload) => {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
