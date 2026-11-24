import { api, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api';
import type {
  ApiResponse,
  ChangePasswordPayload,
  LoginPayload,
  LoginResponseData,
  UpdateProfilePayload,
  User,
  UserRole,
} from '../types/api';

const USER_KEY = 'pantera_user';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    const { data } = response.data;

    setAuthToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post<ApiResponse<null>>('/auth/logout');
    } finally {
      removeAuthToken();
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    const user = response.data.data;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/auth/profile', payload);
    const updatedUser = response.data.data;
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/auth/change-password', payload);
    const updatedUser = response.data.data;
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user?.peran ?? null;
  },
};
