import { api } from '../lib/api';
import type {
  AjukanTerminPayload,
  ApiResponse,
  CairkanTerminPayload,
  KoreksiTerminPayload,
  Termin,
} from '../types/api';

export const billingService = {
  /**
   * Mengajukan tagihan termin yang berstatus 'Siap serah' ke dinas (UC-06).
   */
  async ajukan(idTermin: number, payload: AjukanTerminPayload): Promise<Termin> {
    const response = await api.post<ApiResponse<Termin>>(`/termin/${idTermin}/ajukan`, payload);
    return response.data.data;
  },

  /**
   * Mencatat pengembalian / koreksi administratif dari dinas (UC-06 A1).
   */
  async koreksi(idTermin: number, payload: KoreksiTerminPayload): Promise<Termin> {
    const response = await api.post<ApiResponse<Termin>>(`/termin/${idTermin}/koreksi`, payload);
    return response.data.data;
  },

  /**
   * Mencatat pencairan SP2D untuk termin yang sudah diajukan ke dinas (UC-06).
   */
  async sp2d(idTermin: number, payload: CairkanTerminPayload): Promise<Termin> {
    const response = await api.post<ApiResponse<Termin>>(`/termin/${idTermin}/sp2d`, payload);
    return response.data.data;
  },
};
