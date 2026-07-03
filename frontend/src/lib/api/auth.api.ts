import apiClient from "@/lib/axios";

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
    const res = await apiClient.post("/auth/register", payload);
    return res.data;
  },
  login: async (payload: LoginPayload) => {
    const res = await apiClient.post("/auth/login", payload);
    return res.data;
  },
};
