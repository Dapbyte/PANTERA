import { api } from '../lib/api';
import type {
  ApiResponse,
  ProgresFisik,
  StoreProgresPayload,
  StoreProgresResponseData,
} from '../types/api';

export const progressService = {
  /**
   * Riwayat laporan progres fisik pada satu proyek.
   */
  async list(idProyek: number): Promise<ProgresFisik[]> {
    const response = await api.get<ApiResponse<ProgresFisik[]>>(`/projects/${idProyek}/progress`);
    return response.data.data;
  },

  /**
   * Menginput progres fisik kumulatif dan foto dokumentasi lapangan (UC-08).
   */
  async create(idProyek: number, payload: StoreProgresPayload): Promise<StoreProgresResponseData> {
    const formData = new FormData();
    formData.append('persentase_realisasi', String(payload.persentase_realisasi));
    formData.append('deskripsi_pekerjaan', payload.deskripsi_pekerjaan);

    if (payload.tanggal_lapor) {
      formData.append('tanggal_lapor', payload.tanggal_lapor);
    }
    if (payload.fotos && payload.fotos.length > 0) {
      payload.fotos.forEach((f) => formData.append('fotos[]', f));
    } else if (payload.foto) {
      formData.append('foto', payload.foto);
    }

    const response = await api.post<ApiResponse<StoreProgresResponseData>>(
      `/projects/${idProyek}/progress`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data.data;
  },

  /**
   * Menandai / mencabut verifikasi pengawas untuk laporan progres fisik.
   */
  async verifikasiPengawas(idProgres: number, verifikasiPengawas: boolean): Promise<ProgresFisik> {
    const response = await api.patch<ApiResponse<ProgresFisik>>(
      `/progress/${idProgres}/verifikasi`,
      { verifikasi_pengawas: verifikasiPengawas }
    );
    return response.data.data;
  },
};
