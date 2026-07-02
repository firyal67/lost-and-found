import apiClient from "@/lib/axios";
import { RegisterPayload } from "@/store/slices/authSlice";

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const response = await apiClient.post("/auth/register", payload);
    return response.data;
  },
};
