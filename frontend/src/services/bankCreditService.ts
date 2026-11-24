import { api } from '../lib/api';
import type {
  ApiResponse,
  BankCreditFilters,
  FasilitasKredit,
  PerformanceReport,
  StoreBankCreditPayload,
  UpdateBankCreditPayload,
} from '../types/api';

export const bankCreditService = {
  /**
   * Daftar riwayat koordinasi fasilitas kredit bank (UC-05).
   */
  async list(filters?: BankCreditFilters): Promise<FasilitasKredit[]> {
    const response = await api.get<ApiResponse<FasilitasKredit[]>>('/bank-credits', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Mencatat pengajuan atau kesepakatan koordinasi bank baru (UC-05). Khusus Keuangan.
   */
  async create(payload: StoreBankCreditPayload): Promise<FasilitasKredit> {
    const response = await api.post<ApiResponse<FasilitasKredit>>('/bank-credits', payload);
    return response.data.data;
  },

  /**
   * Memperbarui status atau hasil negosiasi tenor/plafon bank (UC-05). Khusus Keuangan.
   */
  async update(idKredit: number, payload: UpdateBankCreditPayload): Promise<FasilitasKredit> {
    const response = await api.patch<ApiResponse<FasilitasKredit>>(
      `/bank-credits/${idKredit}`,
      payload
    );
    return response.data.data;
  },

  /**
   * Mengambil paket laporan performa proyek resmi untuk diserahkan ke bank (UC-05).
   */
  async getPerformanceReport(idProyek: number): Promise<PerformanceReport> {
    const response = await api.get<ApiResponse<PerformanceReport>>(
      `/projects/${idProyek}/performance-report`
    );
    return response.data.data;
  },
};
