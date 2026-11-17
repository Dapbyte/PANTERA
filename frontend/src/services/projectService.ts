import { api } from '../lib/api';
import type {
  ApiResponse,
  ProjectListFilters,
  Proyek,
  StoreProyekPayload,
} from '../types/api';

export const projectService = {
  /**
   * Mengambil katalog seluruh proyek dengan filter pencarian dan status.
   */
  async getProjects(filters?: ProjectListFilters): Promise<Proyek[]> {
    const response = await api.get<ApiResponse<Proyek[]>>('/projects', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Mengambil detail lengkap proyek berdasarkan ID (termasuk RAB dan Termin).
   */
  async getProjectDetail(idProyek: number): Promise<Proyek> {
    const response = await api.get<ApiResponse<Proyek>>(`/projects/${idProyek}`);
    return response.data.data;
  },

  /**
   * Membuat proyek baru beserta RAB dan tahapan Termin (UC-12 & SD-08).
   * Khusus akun dengan peran Direktur.
   *
   * @throws AxiosError jika validasi bisnis gagal (misal: total termin != nilai kontrak)
   */
  async createProject(payload: StoreProyekPayload): Promise<Proyek> {
    const response = await api.post<ApiResponse<Proyek>>('/projects', payload);
    return response.data.data;
  },
};
