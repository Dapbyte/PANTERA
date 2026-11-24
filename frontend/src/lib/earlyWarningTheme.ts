import type { EarlyWarningStatus } from '../types/api';

export function getEarlyWarningTone(status: EarlyWarningStatus) {
  switch (status) {
    case 'Aman':
      return {
        cardBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
        cardSubtext: 'text-emerald-50',
        badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        banner: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
        dot: 'bg-emerald-300 ring-emerald-200/50',
        label: 'Aman',
      };
    case 'Waspada':
      return {
        cardBg: 'bg-amber-500 text-white shadow-amber-500/20',
        cardSubtext: 'text-amber-50',
        badge: 'bg-amber-50 text-amber-800 border border-amber-200',
        banner: 'bg-amber-50/90 border-amber-200 text-amber-900',
        dot: 'bg-amber-200 ring-amber-100/50',
        label: 'Waspada',
      };
    case 'Kritis':
      return {
        cardBg: 'bg-rose-600 text-white shadow-rose-500/20',
        cardSubtext: 'text-rose-50',
        badge: 'bg-rose-50 text-rose-700 border border-rose-200',
        banner: 'bg-rose-50/90 border-rose-200 text-rose-900',
        dot: 'bg-rose-200 ring-rose-100/50',
        label: 'Kritis',
      };
  }
}
