import { api } from '../lib/api';
import type {
  ApiResponse,
  KendalaLapangan,
  KendalaMutationResponseData,
  ResolveKendalaPayload,
  StatusPenangananKendala,
  StoreKendalaPayload,
} from '../types/api';

export const kendalaService = {
  /**
   * Daftar kendala lapangan pada satu proyek (filter opsional Aktif/Resolved).
   */
  async list(idProyek: number, status?: StatusPenangananKendala): Promise<KendalaLapangan[]> {
    const response = await api.get<ApiResponse<KendalaLapangan[]>>(
      `/projects/${idProyek}/kendala`,
      { params: status ? { status } : undefined }
    );
    return response.data.data;
  },

  /**
   * Melaporkan kendala lapangan baru + foto bukti (UC-09). Khusus Admin Lapangan.
   */
  async create(idProyek: number, payload: StoreKendalaPayload): Promise<KendalaMutationResponseData> {
    const formData = new FormData();
    formData.append('kategori_kendala', payload.kategori_kendala);
    formData.append('tingkat_keparahan', payload.tingkat_keparahan);
    formData.append('deskripsi_kendala', payload.deskripsi_kendala);
    formData.append('estimasi_hari_tertunda', String(payload.estimasi_hari_tertunda));

    if (payload.id_progres) {
      formData.append('id_progres', String(payload.id_progres));
    }
    if (payload.tanggal_kejadian) {
      formData.append('tanggal_kejadian', payload.tanggal_kejadian);
    }
    if (payload.fotos && payload.fotos.length > 0) {
      payload.fotos.forEach((f) => formData.append('fotos[]', f));
    } else if (payload.foto) {
      formData.append('foto', payload.foto);
    }

    const response = await api.post<ApiResponse<KendalaMutationResponseData>>(
      `/projects/${idProyek}/kendala`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data.data;
  },

  /**
   * Menandai kendala selesai / Resolved (UC-09 A1). Khusus Admin Lapangan.
   */
  async resolve(
    idKendala: number,
    payload: ResolveKendalaPayload
  ): Promise<KendalaMutationResponseData> {
    const response = await api.patch<ApiResponse<KendalaMutationResponseData>>(
      `/kendala/${idKendala}/resolve`,
      payload
    );
    return response.data.data;
  },
};
