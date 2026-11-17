import React from 'react';
import { PanteraLogo } from '../common/PanteraLogo';
import {
  Home,
  Archive,
  ClipboardList,
  PhoneCall,
  AlertTriangle,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';

export type UserRole = 'direktur' | 'sekretaris' | 'admin_lapangan';
export type ActiveTab = 'beranda' | 'arsip' | 'termin' | 'contact' | 'kendala';

interface AppLayoutProps {
  role: UserRole;
  currentTab: ActiveTab;
  isMobileDeviceView?: boolean;
  forceMobile?: boolean;
  onSelectTab: (tab: ActiveTab) => void;
  onSwitchRole: (newRole: UserRole) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  role,
  currentTab,
  isMobileDeviceView = false,
  forceMobile = false,
  onSelectTab,
  onSwitchRole,
  onLogout,
  children,
}) => {
  const getProfile = () => {
    switch (role) {
      case 'direktur':
        return { initial: 'DS', name: 'Daniel Sipahutar', roleTitle: 'Direktur' };
      case 'sekretaris':
        return { initial: 'R', name: 'Rita', roleTitle: 'Sekretaris dan Keuangan' };
      case 'admin_lapangan':
        return { initial: 'OD', name: 'Odd Dellarobia', roleTitle: 'Admin Lapangan' };
    }
  };

  const profile = getProfile();
  const isAdminLapangan = role === 'admin_lapangan';

  return (
    <div className={`${forceMobile ? 'h-full flex flex-col' : 'min-h-screen md:flex-row'} bg-[#F8FAFC] flex flex-col font-sans antialiased text-gray-800`}>
      {/* =========================================================================
          1. TOP MOBILE HEADER (Tampil di Mobile / Layar HP sesuai Figma Admin Lapangan)
         ========================================================================= */}
      <header className={`${forceMobile ? 'flex' : 'md:hidden flex'} bg-[#1877F2] text-white px-5 pt-3 pb-4 shadow-md sticky top-0 z-40 flex-col`}>
        {/* Status Bar simulation */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 pb-2">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span>●●●</span>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Brand & User Info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <PanteraLogo variant="light" showText className="w-7 h-7" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-bold text-xs shadow ring-2 ring-white/30">
            {profile.initial}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
          <span className="font-medium">{profile.name}</span>
          <span className="text-white/70">{profile.roleTitle}</span>
        </div>
      </header>

      {/* =========================================================================
          2. DESKTOP SIDEBAR (#1877F2 Solid Blue)
         ========================================================================= */}
      <aside className={`${forceMobile ? 'hidden' : 'hidden md:flex'} w-64 bg-[#1877F2] flex-col shrink-0 text-white shadow-xl min-h-screen`}>
        <div className="p-6 pb-2">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <PanteraLogo variant="light" showText className="w-8 h-8" />
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 pl-1 mb-8">
            <div className="w-10 h-10 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white/30 shrink-0">
              {profile.initial}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-sm tracking-wide text-white truncate">
                {profile.name}
              </div>
              <div className="text-xs text-white/75 font-normal truncate">
                {profile.roleTitle}
              </div>
            </div>
          </div>

          {/* Nav Header */}
          <div className="pt-2">
            <div className="text-[11px] font-medium tracking-wider text-white/70 uppercase mb-2">
              Main Menu
            </div>
            <div className="h-[1px] bg-white/20 mb-4" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* Beranda */}
            <button
              onClick={() => onSelectTab('beranda')}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                currentTab === 'beranda'
                  ? 'bg-white/20 text-white shadow-inner font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </button>

            {/* Kendala Proyek (Hanya Admin Lapangan) */}
            {isAdminLapangan && (
              <button
                onClick={() => onSelectTab('kendala')}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  currentTab === 'kendala'
                    ? 'bg-white/20 text-white shadow-inner font-semibold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Kendala Proyek</span>
              </button>
            )}

            {/* Arsip */}
            <button
              onClick={() => onSelectTab('arsip')}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                currentTab === 'arsip'
                  ? 'bg-white/20 text-white shadow-inner font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Arsip</span>
            </button>

            {/* Menu Khusus Sekretaris */}
            {role === 'sekretaris' && (
              <>
                <button
                  onClick={() => onSelectTab('termin')}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                    currentTab === 'termin'
                      ? 'bg-white/20 text-white shadow-inner font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Pemantauan Proyek</span>
                </button>

                <button
                  onClick={() => onSelectTab('contact')}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                    currentTab === 'contact'
                      ? 'bg-white/20 text-white shadow-inner font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Contact Person</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto p-5 border-t border-white/15 space-y-2">
          <div className="space-y-1">
            <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold px-1">
              Ganti Akses Peran:
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <button
                onClick={() => onSwitchRole('direktur')}
                className={`py-1.5 px-2 rounded-lg text-center font-medium transition cursor-pointer ${
                  role === 'direktur' ? 'bg-white text-[#1877F2] font-bold shadow' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Direktur
              </button>
              <button
                onClick={() => onSwitchRole('sekretaris')}
                className={`py-1.5 px-2 rounded-lg text-center font-medium transition cursor-pointer ${
                  role === 'sekretaris' ? 'bg-white text-[#1877F2] font-bold shadow' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Sekretaris
              </button>
              <button
                onClick={() => onSwitchRole('admin_lapangan')}
                className={`py-1.5 px-2 rounded-lg text-center font-medium transition cursor-pointer ${
                  role === 'admin_lapangan' ? 'bg-white text-[#1877F2] font-bold shadow' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Lapangan
              </button>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-xs text-white/70 hover:text-white transition py-2 px-3 rounded-lg hover:bg-white/10 cursor-pointer pt-3"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          3. MAIN CONTENT AREA
         ========================================================================= */}
      {forceMobile ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto px-4 py-5 pb-2 bg-[#F9FBFF]">
            {children}
          </main>
          {/* Bottom nav inside phone frame */}
          <nav className="flex bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 z-40 items-center justify-around shadow-lg shrink-0">
            {/* Tab 1: Beranda */}
            <button
              onClick={() => onSelectTab('beranda')}
              className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition cursor-pointer ${
                currentTab === 'beranda'
                  ? 'bg-blue-50 text-[#1877F2] font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px]">Beranda</span>
            </button>

            {isAdminLapangan ? (
              <button
                onClick={() => onSelectTab('kendala')}
                className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition cursor-pointer ${
                  currentTab === 'kendala'
                    ? 'bg-blue-50 text-[#1877F2] font-semibold'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px]">Kendala Proyek</span>
              </button>
            ) : role === 'sekretaris' ? (
              <button
                onClick={() => onSelectTab('termin')}
                className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition cursor-pointer ${
                  currentTab === 'termin'
                    ? 'bg-blue-50 text-[#1877F2] font-semibold'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span className="text-[10px]">Proyek</span>
              </button>
            ) : null}

            <button
              onClick={() => onSelectTab('arsip')}
              className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition cursor-pointer ${
                currentTab === 'arsip'
                  ? 'bg-blue-50 text-[#1877F2] font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span className="text-[10px]">Arsip</span>
            </button>
          </nav>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-10 py-6 md:py-8 pb-24 md:pb-8 bg-[#F9FBFF]">
          {children}
        </main>
      )}
    </div>
  );
};
