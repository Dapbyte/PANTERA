import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services';
import type { NotificationModule, NotificationSummary } from '../types/api';
import { emptyBadges, emptyCounts, RealtimeSyncContext } from './realtimeSyncStore';

interface RealtimeSyncProviderProps {
  enabled: boolean;
  activeTab?: NotificationModule | null;
  children: React.ReactNode;
}

export const RealtimeSyncProvider: React.FC<RealtimeSyncProviderProps> = ({
  enabled,
  activeTab = null,
  children,
}) => {
  const queryClient = useQueryClient();
  const prevSyncVersion = useRef<string | null>(null);

  const { data } = useQuery<NotificationSummary>({
    queryKey: ['notifications', 'summary'],
    queryFn: () => notificationService.getSummary(),
    enabled,
    refetchInterval: enabled ? 5000 : false,
    refetchOnWindowFocus: true,
    staleTime: 3000,
  });

  useEffect(() => {
    if (!enabled) {
      prevSyncVersion.current = null;
      return;
    }
    const nextVersion = data?.sync_version;
    if (!nextVersion) return;

    if (prevSyncVersion.current !== null && prevSyncVersion.current !== nextVersion) {
      void queryClient.invalidateQueries({
        predicate: (q) => q.queryKey[0] !== 'notifications',
      });
    }
    prevSyncVersion.current = nextVersion;
  }, [data?.sync_version, enabled, queryClient]);

  const markTabSeen = useCallback(
    async (modul: NotificationModule) => {
      if (!enabled) return;
      queryClient.setQueryData<NotificationSummary>(['notifications', 'summary'], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          badges: { ...prev.badges, [modul]: false },
          counts: { ...prev.counts, [modul]: 0 },
        };
      });
      try {
        await notificationService.markSeen(modul);
      } catch {
        // Jangan mengganggu navigasi jika endpoint offline sesaat
      }
    },
    [enabled, queryClient]
  );

  // Jika data baru masuk saat user sedang membuka tab terkait, langsung anggap terbaca (BUG 3.2)
  const hasActiveTabBadge = Boolean(activeTab && data?.badges?.[activeTab]);
  useEffect(() => {
    if (!enabled || !activeTab || !hasActiveTabBadge) return;
    void markTabSeen(activeTab);
  }, [enabled, activeTab, hasActiveTabBadge, markTabSeen]);

  const triggerSyncNow = useCallback(async () => {
    if (!enabled) return;
    await queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] !== 'notifications',
    });
    await queryClient.invalidateQueries({ queryKey: ['notifications', 'summary'] });
  }, [enabled, queryClient]);

  const maskedBadges = useMemo(() => {
    const base = data?.badges ?? emptyBadges;
    return activeTab ? { ...base, [activeTab]: false } : base;
  }, [data?.badges, activeTab]);

  const maskedCounts = useMemo(() => {
    const base = data?.counts ?? emptyCounts;
    return activeTab ? { ...base, [activeTab]: 0 } : base;
  }, [data?.counts, activeTab]);

  return (
    <RealtimeSyncContext.Provider
      value={{
        badges: maskedBadges,
        counts: maskedCounts,
        syncVersion: data?.sync_version ?? 'init',
        markTabSeen,
        triggerSyncNow,
      }}
    >
      {children}
    </RealtimeSyncContext.Provider>
  );
};
