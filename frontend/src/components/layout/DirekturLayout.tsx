import React from 'react';
import { PanteraLogo } from '../common/PanteraLogo';
import { Home, Archive, LogOut } from 'lucide-react';

export type DirekturNavTab = 'beranda' | 'arsip';

interface DirekturLayoutProps {
  currentTab: DirekturNavTab;
  onSelectTab: (tab: DirekturNavTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const DirekturLayout: React.FC<DirekturLayoutProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-gray-800">
      {/* Sidebar - Solid Blue with rounded top-right edge matching Figma */}
      <aside className="w-64 bg-[#1877F2] flex flex-col shrink-0 text-white shadow-xl min-h-screen">
        <div className="p-6 pb-2">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <PanteraLogo variant="light" showText className="w-8 h-8" />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-1 mb-8">
            <div className="w-10 h-10 rounded-full bg-white text-[#1877F2] flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white/30">
              DS
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-sm tracking-wide text-white truncate">
                Daniel Sipahutar
              </div>
              <div className="text-xs text-white/75 font-normal">Direktur</div>
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
          </nav>
        </div>

        {/* Bottom logout / status */}
        <div className="mt-auto p-6 border-t border-white/15">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-xs text-white/70 hover:text-white transition py-2 px-3 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-10 py-8 bg-[#F9FBFF]">
        {children}
      </main>
    </div>
  );
};
