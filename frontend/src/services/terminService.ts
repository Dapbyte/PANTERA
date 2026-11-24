import { api } from '../lib/api';
import type {
  ApiResponse,
  DokumenTerminMutationResponse,
  TerminChecklistResponse,
  TerminListItem,
  UploadDokumenTerminPayload,
  VerifikasiDokumenPayload,
} from '../types/api';

export const terminService = {
  /**
   * Daftar seluruh tahapan termin proyek beserta ringkasan checklist dokumen.
   */
  async listByProject(idProyek: number): Promise<TerminListItem[]> {
    const response = await api.get<ApiResponse<TerminListItem[]>>(`/projects/${idProyek}/termin`);
    return response.data.data;
  },

  /**
   * Checklist kelengkapan 4 dokumen wajib untuk satu termin (UC-10).
   */
  async getChecklist(idTermin: number): Promise<TerminChecklistResponse> {
    const response = await api.get<ApiResponse<TerminChecklistResponse>>(
      `/termin/${idTermin}/checklist`
    );
    return response.data.data;
  },

  /**
   * Unggah dokumen bukti persyaratan termin (UC-10). Khusus Admin Lapangan.
   */
  async uploadDokumen(
    idTermin: number,
    payload: UploadDokumenTerminPayload
  ): Promise<DokumenTerminMutationResponse> {
    const formData = new FormData();
    formData.append('jenis_dokumen', payload.jenis_dokumen);
    formData.append('file_dokumen', payload.file_dokumen);

    const response = await api.post<ApiResponse<DokumenTerminMutationResponse>>(
      `/termin/${idTermin}/dokumen`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data.data;
  },

  /**
   * Mengambil blob berkas dokumen termin terautentikasi untuk preview inline & unduhan.
   */
  async fetchDokumenBlob(
    idTermin: number,
    idDokumen: number,
    download = false
  ): Promise<{ blob: Blob; contentType: string }> {
    const response = await api.get<Blob>(`/termin/${idTermin}/dokumen/${idDokumen}/file`, {
      params: download ? { download: 1 } : undefined,
      responseType: 'blob',
    });
    const contentType =
      (response.headers['content-type'] as string | undefined) ||
      response.data.type ||
      'application/octet-stream';
    return { blob: response.data, contentType };
  },

  /**
   * Verifikasi atau tolak berkas dokumen termin (Khusus Keuangan).
   */
  async verifikasiDokumen(
    idTermin: number,
    idDokumen: number,
    payload: VerifikasiDokumenPayload
  ): Promise<DokumenTerminMutationResponse> {
    const response = await api.patch<ApiResponse<DokumenTerminMutationResponse>>(
      `/termin/${idTermin}/dokumen/${idDokumen}/verifikasi`,
      payload
    );
    return response.data.data;
  },
};
