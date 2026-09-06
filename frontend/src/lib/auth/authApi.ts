import { api } from "../api";
import type { AuthResponse, User } from "./types";

export const authApi = {
  async register(input: { name: string; email: string; password: string }) {
    const { data } = await api.post<AuthResponse>("/api/auth/register", input);
    return data;
  },

  async login(input: { email: string; password: string }) {
    const { data } = await api.post<AuthResponse>("/api/auth/login", input);
    return data;
  },

  async me() {
    const { data } = await api.get<User>("/api/auth/me");
    return data;
  },

  async logout(refreshToken: string) {
    await api.post("/api/auth/logout", { refreshToken });
  },

  async updateProfile(input: { name: string; avatarUrl: string | null }) {
    const { data } = await api.put<User>("/api/profile", input);
    return data;
  },
};
