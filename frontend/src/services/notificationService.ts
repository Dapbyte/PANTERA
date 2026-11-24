import { api } from '../lib/api';
import type { ApiResponse, NotificationModule, NotificationSummary } from '../types/api';

export const notificationService = {
  async getSummary(): Promise<NotificationSummary> {
    const response = await api.get<ApiResponse<NotificationSummary>>('/notifications/summary');
    return response.data.data;
  },

  async markSeen(modul: NotificationModule): Promise<void> {
    await api.post<ApiResponse<null>>('/notifications/seen', { modul });
  },
};
