import type { ReactNode } from 'react';
import { PanteraLogo } from '../common/PanteraLogo';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import type { NotificationModule, User, UserRole } from '../../types/api';
import {
  Home,
  Archive,
  ClipboardList,
  Landmark,
  AlertTriangle,
  LogOut,
  FolderKanban,
  Users,
} from 'lucide-react';

export type ActiveTab =
  | 'beranda'
  | 'proyek'
  | 'arsip'
  | 'termin'
  | 'contact'
  | 'kendala'
  | 'users';

interface AppLayoutProps {
  user: User;
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  children: ReactNode;
}

const roleTitleMap: Record<UserRole, string> = {
  Direktur: 'Direktur',
  SekretarisKeuangan: 'Sekretaris & Keuangan',
  AdminLapangan: 'Admin Lapangan',
};

function getInitials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AppLayout = ({
  user,
  currentTab,
  onSelectTab,
  onLogout,
  children,
}: AppLayoutProps) => {
  const role = user.peran;
  const isAdminLapangan = role === 'AdminLapangan';
  const roleTitle = roleTitleMap[role] ?? role;
  const initials = getInitials(user.nama);
  const { badges } = useRealtimeSync();
  const { confirm } = useUiFeedback();

  const handleRequestLogout = async () => {
    const ok = await confirm({
      title: 'Konfirmasi Keluar',
      message: 'Yakin ingin keluar dari sistem PANTERA?',
      confirmLabel: 'Ya, Keluar',
      cancelLabel: 'Batal',
      variant: 'danger',
    });
    if (ok) {
      onLogout();
    }
  };

  const menuItems: { tab: ActiveTab; label: string; icon: typeof Home; show: boolean }[] = [
    { tab: 'beranda', label: 'Beranda', icon: Home, show: true },
    { tab: 'proyek', label: 'Proyek & RAB', icon: FolderKanban, show: role === 'Direktur' },
    {
      tab: 'termin',
      label: 'Pemantauan Proyek',
      icon: ClipboardList,
      show: role === 'SekretarisKeuangan',
    },
    { tab: 'kendala', label: 'Kendala Proyek', icon: AlertTriangle, show: isAdminLapangan },
    { tab: 'arsip', label: 'Arsip', icon: Archive, show: true },
    {
      tab: 'contact',
      label: 'Kredit & Dinas',
      icon: Landmark,
      show: role === 'SekretarisKeuangan',
    },
    { tab: 'users', label: 'Pengguna', icon: Users, show: role === 'Direktur' },
  ];

  const desktopMenu = menuItems.filter((item) => item.show);
  const mobileMenu: { tab: ActiveTab; label: string; icon: typeof Home }[] = [
    { tab: 'beranda', label: 'Beranda', icon: Home },
    ...(role === 'Direktur'
      ? [
          { tab: 'proyek' as ActiveTab, label: 'Proyek', icon: FolderKanban },
          { tab: 'users' as ActiveTab, label: 'Pengguna', icon: Users },
        ]
      : role === 'SekretarisKeuangan'
        ? [{ tab: 'termin' as ActiveTab, label: 'Proyek', icon: ClipboardList }]
        : [{ tab: 'kendala' as ActiveTab, label: 'Kendala', icon: AlertTriangle }]),
    { tab: 'arsip', label: 'Arsip', icon: Archive },
    ...(role === 'SekretarisKeuangan'
      ? [{ tab: 'contact' as ActiveTab, label: 'Bank', icon: Landmark }]
      : []),
  ];

  const hasBadge = (tab: ActiveTab) =>
    tab !== currentTab && Boolean(badges[tab as NotificationModule]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-gray-800 md:flex-row">
      {/* ============================= Mobile Header ============================= */}
      <header className="sticky top-0 z-40 bg-[#1877F2] text-white shadow-md md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <PanteraLogo variant="light" showText className="h-7 w-7" />

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="min-w-0 text-right leading-tight">
              <div className="truncate text-xs font-semibold">{user.nama}</div>
              <div className="truncate text-[10px] text-white/75">{roleTitle}</div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#1877F2] shadow ring-2 ring-white/30">
              {initials}
            </div>
            <button
              type="button"
              onClick={() => void handleRequestLogout()}
              title="Keluar Sistem"
              aria-label="Keluar Sistem"
              className="rounded-lg p-1.5 text-white/85 hover:bg-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================== Desktop Sidebar ========================== */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#1877F2] text-white shadow-xl md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto scrollbar-thin">
        <div className="p-6 pb-2">
          <div className="mb-7 flex items-center gap-2">
            <PanteraLogo variant="light" showText className="h-8 w-8" />
          </div>

          <div className="mb-7 flex items-center gap-3 pl-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1877F2] shadow-sm ring-2 ring-white/30">
              {initials}
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="truncate text-sm font-semibold tracking-wide text-white">
                {user.nama}
              </div>
              <div className="truncate text-xs font-normal text-white/75">{roleTitle}</div>
            </div>
          </div>

          <nav className="space-y-1.5 border-t border-white/15 pt-4">
            {desktopMenu.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.tab;
              const showBadge = hasBadge(item.tab);
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onSelectTab(item.tab)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium ${
                    active
                      ? 'bg-white/20 font-semibold text-white shadow-inner'
                      : 'text-white/85 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {showBadge && (
                    <span
                      aria-label={`Pembaruan baru pada ${item.label}`}
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 ring-2 ring-white shadow-sm"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/15 p-5">
          <button
            type="button"
            onClick={() => void handleRequestLogout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white/85 hover:bg-white/15 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* =============================== Main Content ============================ */}
      <main className="min-w-0 flex-1 bg-[#F9FBFF] px-4 pb-24 pt-5 sm:px-8 sm:pt-6 md:px-10 md:pb-10 md:pt-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>

      {/* ============================ Mobile Bottom Nav ========================== */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gray-200 bg-white/95 px-2 py-2 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden">
        {mobileMenu.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.tab;
          const showBadge = hasBadge(item.tab);
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 ${
                active
                  ? 'bg-blue-50 font-semibold text-[#1877F2]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span
                    aria-label={`Pembaruan baru pada ${item.label}`}
                    className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                  />
                )}
              </span>
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
