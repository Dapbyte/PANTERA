import { api } from '../lib/api';
import type { ApiResponse, CreateUserPayload, User } from '../types/api';

export const userService = {
  /**
   * Mengambil daftar seluruh pengguna sistem (khusus peran Direktur).
   */
  async getUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  /**
   * Mendaftarkan pengguna baru ke sistem PANTERA (khusus peran Direktur).
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users', payload);
    return response.data.data;
  },
};
