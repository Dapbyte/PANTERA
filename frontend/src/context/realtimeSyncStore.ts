import { createContext, useContext } from 'react';
import type { NotificationModule } from '../types/api';

export interface RealtimeSyncContextValue {
  badges: Record<NotificationModule, boolean>;
  counts: Record<NotificationModule, number>;
  syncVersion: string;
  markTabSeen: (modul: NotificationModule) => Promise<void>;
  triggerSyncNow: () => Promise<void>;
}

export const emptyBadges: Record<NotificationModule, boolean> = {
  beranda: false,
  proyek: false,
  termin: false,
  kendala: false,
  arsip: false,
  contact: false,
  users: false,
};

export const emptyCounts: Record<NotificationModule, number> = {
  beranda: 0,
  proyek: 0,
  termin: 0,
  kendala: 0,
  arsip: 0,
  contact: 0,
  users: 0,
};

export const RealtimeSyncContext = createContext<RealtimeSyncContextValue>({
  badges: emptyBadges,
  counts: emptyCounts,
  syncVersion: 'init',
  markTabSeen: async () => undefined,
  triggerSyncNow: async () => undefined,
});

export function useRealtimeSync(): RealtimeSyncContextValue {
  return useContext(RealtimeSyncContext);
}
