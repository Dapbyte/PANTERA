import { useEffect, useState, type ReactNode } from 'react';
import { PanteraLogo } from '../common/PanteraLogo';
import { api } from '../../lib/api';
import {
  Home,
  Archive,
  ClipboardList,
  PhoneCall,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

export type UserRole = 'direktur' | 'sekretaris' | 'admin_lapangan';
export type ActiveTab = 'beranda' | 'arsip' | 'termin' | 'contact' | 'kendala';

interface AppLayoutProps {
  role: UserRole;
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  children: ReactNode;
}

type ApiStatus = 'checking' | 'online' | 'offline';

const roleProfile: Record<UserRole, { initial: string; name: string; roleTitle: string }> = {
  direktur: { initial: 'DS', name: 'Daniel Sipahutar', roleTitle: 'Direktur' },
  sekretaris: { initial: 'R', name: 'Rita', roleTitle: 'Sekretaris & Keuangan' },
  admin_lapangan: { initial: 'OD', name: 'Odd Dellarobia', roleTitle: 'Admin Proyek' },
};

export const AppLayout = ({
  role,
  currentTab,
  onSelectTab,
  onLogout,
  children,
}: AppLayoutProps) => {
  const profile = roleProfile[role];
  const isAdminLapangan = role === 'admin_lapangan';

  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  const checkApi = async () => {
    setApiStatus('checking');
    try {
      const response = await api.get('/health');
      setApiStatus(response.data?.status === 'success' ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  };

  useEffect(() => {
    let cancelled = false;

    api
      .get('/health')
      .then((response) => {
        if (!cancelled) {
          setApiStatus(response.data?.status === 'success' ? 'online' : 'offline');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiStatus('offline');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const menuItems: { tab: ActiveTab; label: string; icon: typeof Home; show: boolean }[] = [
    { tab: 'beranda', label: 'Beranda', icon: Home, show: true },
    { tab: 'termin', label: 'Pemantauan Proyek', icon: ClipboardList, show: role === 'sekretaris' },
    { tab: 'kendala', label: 'Kendala Proyek', icon: AlertTriangle, show: isAdminLapangan },
    { tab: 'arsip', label: 'Arsip', icon: Archive, show: true },
    { tab: 'contact', label: 'Contact Person', icon: PhoneCall, show: role === 'sekretaris' },
  ];

  const desktopMenu = menuItems.filter((item) => item.show);
  const mobileMenu: { tab: ActiveTab; label: string; icon: typeof Home }[] = [
    { tab: 'beranda', label: 'Beranda', icon: Home },
    ...(isAdminLapangan
      ? [{ tab: 'kendala' as ActiveTab, label: 'Kendala', icon: AlertTriangle }]
      : role === 'sekretaris'
        ? [{ tab: 'termin' as ActiveTab, label: 'Proyek', icon: ClipboardList }]
        : []),
    { tab: 'arsip', label: 'Arsip', icon: Archive },
    ...(role === 'sekretaris'
      ? [{ tab: 'contact' as ActiveTab, label: 'Kontak', icon: PhoneCall }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-gray-800 md:flex-row">
      {/* ============================= Mobile Header ============================= */}
      <header className="sticky top-0 z-40 bg-[#1877F2] text-white shadow-md md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <PanteraLogo variant="light" showText className="h-7 w-7" />

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="min-w-0 text-right leading-tight">
              <div className="truncate text-xs font-semibold">{profile.name}</div>
              <div className="truncate text-[10px] text-white/75">{profile.roleTitle}</div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#1877F2] shadow ring-2 ring-white/30">
              {profile.initial}
            </div>
          </div>
        </div>
      </header>

      {/* ============================== Desktop Sidebar ========================== */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#1877F2] text-white shadow-xl md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto scrollbar-thin">
        <div className="p-6 pb-2">
          <div className="mb-8 flex items-center gap-2">
            <PanteraLogo variant="light" showText className="h-8 w-8" />
          </div>

          <div className="mb-8 flex items-center gap-3 pl-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1877F2] shadow-sm ring-2 ring-white/30">
              {profile.initial}
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="truncate text-sm font-semibold tracking-wide text-white">
                {profile.name}
              </div>
              <div className="truncate text-xs font-normal text-white/75">{profile.roleTitle}</div>
            </div>
          </div>

          <div className="pt-2">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/70">
              Main Menu
            </div>
            <div className="mb-4 h-px bg-white/20" />
          </div>

          <nav className="space-y-1.5">
            {desktopMenu.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => onSelectTab(item.tab)}
                  className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition cursor-pointer ${
                    active
                      ? 'bg-white/20 font-semibold text-white shadow-inner'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-3 border-t border-white/15 p-5">
          <button
            onClick={() => void checkApi()}
            title="Klik untuk memeriksa ulang koneksi API"
            className="flex w-full items-center gap-2 rounded-lg px-1 text-[11px] text-white/75 transition hover:text-white cursor-pointer"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === 'online'
                  ? 'bg-emerald-400'
                  : apiStatus === 'checking'
                    ? 'animate-pulse bg-amber-300'
                    : 'bg-rose-400'
              }`}
            />
            {apiStatus === 'online' && <Wifi className="h-3.5 w-3.5" />}
            {apiStatus === 'offline' && <WifiOff className="h-3.5 w-3.5" />}
            {apiStatus === 'checking' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            <span>
              {apiStatus === 'online'
                ? 'API terhubung'
                : apiStatus === 'checking'
                  ? 'Memeriksa API…'
                  : 'API tidak terhubung'}
            </span>
          </button>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
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
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gray-200 bg-white/95 px-3 py-2 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden">
        {mobileMenu.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => onSelectTab(item.tab)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition cursor-pointer ${
                active ? 'bg-blue-50 font-semibold text-[#1877F2]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
