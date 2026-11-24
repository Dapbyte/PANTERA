import { api } from '../lib/api';
import type { ApiResponse, EarlyWarningAnalysis, EarlyWarningPortfolio } from '../types/api';

export const earlyWarningService = {
  /**
   * Ringkasan portofolio early warning seluruh proyek aktif (Direktur & Sekretaris/Keuangan).
   */
  async getPortfolio(): Promise<EarlyWarningPortfolio> {
    const response = await api.get<ApiResponse<EarlyWarningPortfolio>>('/early-warning');
    return response.data.data;
  },

  /**
   * Analisis early warning mendetail untuk satu proyek (UC-04).
   */
  async getProjectAnalysis(idProyek: number): Promise<EarlyWarningAnalysis> {
    const response = await api.get<ApiResponse<EarlyWarningAnalysis>>(
      `/projects/${idProyek}/early-warning`
    );
    return response.data.data;
  },
};
