import { api } from '../lib/api';
import type {
  ApiResponse,
  ApproveMaterialPayload,
  MaterialListFilters,
  RequestMaterial,
  StoreMaterialPayload,
  UpdateMaterialPayload,
  ValidateMaterialPayload,
} from '../types/api';

export const materialService = {
  /**
   * Daftar seluruh pengajuan material (dapat difilter proyek, status, sifat, dan q).
   */
  async list(filters?: MaterialListFilters): Promise<RequestMaterial[]> {
    const response = await api.get<ApiResponse<RequestMaterial[]>>('/material-requests', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Detail lengkap pengajuan material beserta rincian item, sisa pagu RAB, dan PO.
   */
  async getDetail(idRequest: number): Promise<RequestMaterial> {
    const response = await api.get<ApiResponse<RequestMaterial>>(`/material-requests/${idRequest}`);
    return response.data.data;
  },

  /**
   * Mengajukan kebutuhan material baru (UC-07). Khusus Admin Lapangan.
   */
  async create(payload: StoreMaterialPayload): Promise<RequestMaterial> {
    const response = await api.post<ApiResponse<RequestMaterial>>('/material-requests', payload);
    return response.data.data;
  },

  /**
   * Mengajukan ulang request material yang berstatus Revisi. Khusus Admin Lapangan.
   */
  async revise(idRequest: number, payload: UpdateMaterialPayload): Promise<RequestMaterial> {
    const response = await api.put<ApiResponse<RequestMaterial>>(
      `/material-requests/${idRequest}`,
      payload
    );
    return response.data.data;
  },

  /**
   * Validasi pengajuan material terhadap RAB & kas/kredit oleh Keuangan (UC-03).
   */
  async validateFinance(
    idRequest: number,
    payload: ValidateMaterialPayload
  ): Promise<RequestMaterial> {
    const response = await api.patch<ApiResponse<RequestMaterial>>(
      `/material-requests/${idRequest}/validate`,
      payload
    );
    return response.data.data;
  },

  /**
   * Persetujuan / permintaan revisi akhir oleh Direktur (UC-01).
   */
  async approve(idRequest: number, payload: ApproveMaterialPayload): Promise<RequestMaterial> {
    const response = await api.patch<ApiResponse<RequestMaterial>>(
      `/material-requests/${idRequest}/approve`,
      payload
    );
    return response.data.data;
  },
};
