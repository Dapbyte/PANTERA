import axios from 'axios';
import { api } from '../lib/api';
import type {
  ArchiveDetailResponseData,
  ArchiveSearchFilters,
  ApiResponse,
  ArsipDokumen,
  CreateArchiveResponseData,
  StoreArsipPayload,
} from '../types/api';

export const archiveService = {
  /**
   * Pencarian multi-kriteria repositori arsip dokumen (UC-02 & SD-07).
   * Menangani kode status 404 (SD-07: Arsip tidak ditemukan) dengan mengembalikan array kosong [].
   */
  async searchArchives(filters?: ArchiveSearchFilters): Promise<ArsipDokumen[]> {
    try {
      const response = await api.get<ApiResponse<ArsipDokumen[]>>('/archive', {
        params: filters,
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // SD-07: Repositori mengembalikan 404 jika hasil pencarian kosong
        return [];
      }
      throw error;
    }
  },

  /**
   * Mengambil detail arsip lengkap beserta lokasi fisik dan URL file digital.
   */
  async getArchiveDetail(idArsip: number): Promise<ArchiveDetailResponseData> {
    const response = await api.get<ApiResponse<ArchiveDetailResponseData>>(`/archive/${idArsip}`);
    return response.data.data;
  },

  /**
   * Pencatatan arsip baru ke repositori fisik / digital / hibrida (UC-11).
   * Otomatis mengonversi payload ke FormData untuk pengunggahan berkas digital.
   */
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

    // Koordinat fisik jika tipe Fisik atau Hibrida
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

  /**
   * Menghapus dokumen arsip dari repositori.
   * Khusus akun Direktur.
   */
  async deleteArchive(idArsip: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/archive/${idArsip}`);
  },

  /**
   * Helper untuk mendapatkan URL unduh/lihat file digital dari path penyimpanan backend.
   */
  getDigitalFileUrl(pathDigital: string | null): string | null {
    if (!pathDigital) return null;
    if (pathDigital.startsWith('http://') || pathDigital.startsWith('https://')) {
      return pathDigital;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    // Membersihkan double slash jika ada
    const cleanBase = baseUrl.replace(/\/api$/, '');
    const cleanPath = pathDigital.startsWith('/') ? pathDigital : `/${pathDigital}`;
    return `${cleanBase}/storage${cleanPath}`;
  },
};
