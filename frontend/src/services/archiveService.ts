import { api } from '../lib/api';
import type {
  ArchiveDetailResponseData,
  ArchivePaginatedResponse,
  ArchiveSearchFilters,
  ApiResponse,
  CreateArchiveResponseData,
  StoreArsipPayload,
  UpdateArchiveResponseData,
  UpdateArsipPayload,
} from '../types/api';

export const archiveService = {
  /**
   * Pencarian & daftar arsip dengan pagination & pengurutan (selalu 200 OK).
   */
  async searchArchives(filters?: ArchiveSearchFilters): Promise<ArchivePaginatedResponse> {
    const response = await api.get<ApiResponse<ArchivePaginatedResponse>>('/archive', {
      params: filters,
    });
    return response.data.data;
  },

  async getArchiveDetail(idArsip: number): Promise<ArchiveDetailResponseData> {
    const response = await api.get<ApiResponse<ArchiveDetailResponseData>>(`/archive/${idArsip}`);
    return response.data.data;
  },

  /**
   * Mengambil blob berkas digital secara terautentikasi untuk preview inline & unduh tanpa 404.
   */
  async fetchArchiveFileBlob(idArsip: number, download = false): Promise<{ blob: Blob; contentType: string }> {
    const response = await api.get<Blob>(`/archive/${idArsip}/file`, {
      params: download ? { download: 1 } : undefined,
      responseType: 'blob',
    });
    const contentType =
      (response.headers['content-type'] as string | undefined) ||
      response.data.type ||
      'application/octet-stream';
    return { blob: response.data, contentType };
  },

  async createArchive(payload: StoreArsipPayload): Promise<CreateArchiveResponseData> {
    const formData = new FormData();

    formData.append('id_proyek', String(payload.id_proyek));
    formData.append('nomor_surat', payload.nomor_surat);
    formData.append('jenis_transaksi', payload.jenis_transaksi);
    formData.append('pihak_penyedia', payload.pihak_penyedia);
    formData.append('judul_dokumen', payload.judul_dokumen);
    formData.append('jenis_arsip', payload.jenis_arsip);
    formData.append('tanggal_arsip', payload.tanggal_arsip);
    formData.append('tipe_penyimpanan', payload.tipe_penyimpanan);

    if (payload.kode_arsip) {
      formData.append('kode_arsip', payload.kode_arsip);
    }

    if (payload.file_dokumen) {
      formData.append('file_dokumen', payload.file_dokumen);
    }

    if (payload.nomor_binder) formData.append('nomor_binder', payload.nomor_binder);
    if (payload.nomor_rak) formData.append('nomor_rak', payload.nomor_rak);
    if (payload.ruang_simpan) formData.append('ruang_simpan', payload.ruang_simpan);
    if (payload.keterangan_posisi) formData.append('keterangan_posisi', payload.keterangan_posisi);

    if (payload.id_request) {
      formData.append('id_request', String(payload.id_request));
    }

    const response = await api.post<ApiResponse<CreateArchiveResponseData>>('/archive', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  async updateArchive(idArsip: number, payload: UpdateArsipPayload): Promise<UpdateArchiveResponseData> {
    const response = await api.patch<ApiResponse<UpdateArchiveResponseData>>(`/archive/${idArsip}`, payload);
    return response.data.data;
  },

  async deleteArchive(idArsip: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/archive/${idArsip}`);
  },

  getDigitalFileUrl(pathDigital: string | null): string | null {
    if (!pathDigital) return null;
    if (pathDigital.startsWith('http://') || pathDigital.startsWith('https://')) {
      return pathDigital;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const cleanBase = baseUrl.replace(/\/api$/, '');
    const cleanPath = pathDigital.startsWith('/') ? pathDigital : `/${pathDigital}`;
    return `${cleanBase}/storage${cleanPath}`;
  },
};
