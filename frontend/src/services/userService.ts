import { api } from '../lib/api';
import type {
  ApiResponse,
  CreateUserPayload,
  CreateUserResponseData,
  UpdateUserPayload,
  User,
} from '../types/api';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  async createUser(payload: CreateUserPayload): Promise<CreateUserResponseData> {
    const response = await api.post<ApiResponse<CreateUserResponseData>>('/users', payload);
    return response.data.data;
  },

  async updateUser(idPengguna: number, payload: UpdateUserPayload): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${idPengguna}`, payload);
    return response.data.data;
  },

  async deleteUser(idPengguna: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/users/${idPengguna}`);
  },
};
