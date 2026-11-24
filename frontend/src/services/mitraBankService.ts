import { api } from '../lib/api';
import type { ApiResponse, MitraBank, StoreMitraBankPayload } from '../types/api';

export const mitraBankService = {
  async list(): Promise<MitraBank[]> {
    const response = await api.get<ApiResponse<MitraBank[]>>('/mitra-bank');
    return response.data.data;
  },

  async create(payload: StoreMitraBankPayload): Promise<MitraBank> {
    const response = await api.post<ApiResponse<MitraBank>>('/mitra-bank', payload);
    return response.data.data;
  },

  async update(idBank: number, payload: StoreMitraBankPayload): Promise<MitraBank> {
    const response = await api.patch<ApiResponse<MitraBank>>(`/mitra-bank/${idBank}`, payload);
    return response.data.data;
  },

  async destroy(idBank: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/mitra-bank/${idBank}`);
  },
};
