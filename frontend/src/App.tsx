import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AppLayout, type UserRole, type ActiveTab } from './components/layout/AppLayout';

// Halaman Direktur
import { DirekturBerandaPage } from './pages/direktur/DirekturBerandaPage';
import { DirekturDetailPage } from './pages/direktur/DirekturDetailPage';
import { DirekturArsipPage } from './pages/direktur/DirekturArsipPage';

// Halaman Sekretaris
import { SekretarisBerandaPage } from './pages/sekretaris/SekretarisBerandaPage';
import { SekretarisArsipPage } from './pages/sekretaris/SekretarisArsipPage';
import { SekretarisTerminListPage } from './pages/sekretaris/SekretarisTerminListPage';
import { SekretarisTerminDetailPage } from './pages/sekretaris/SekretarisTerminDetailPage';
import { SekretarisContactPage } from './pages/sekretaris/SekretarisContactPage';

// Halaman Admin Lapangan
import { AdminBerandaPage } from './pages/admin/AdminBerandaPage';
import { AdminProyekDetailPage } from './pages/admin/AdminProyekDetailPage';
import { AdminKendalaPage } from './pages/admin/AdminKendalaPage';
import { AdminArsipPage } from './pages/admin/AdminArsipPage';

// Mock Data
import { initialPengajuanList, initialArsipList } from './mock/direkturData';
import { initialProyekTerminList } from './mock/sekretarisData';
import type { ArsipItem } from './types/direktur';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [role, setRole] = useState<UserRole>('admin_lapangan');
  const [currentTab, setCurrentTab] = useState<ActiveTab>('beranda');
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // State navigasi detail
  const [selectedPengajuanId, setSelectedPengajuanId] = useState<string | null>(null);
  const [selectedProyekId, setSelectedProyekId] = useState<string | null>(null);

  // Data state
  const [pengajuanList, setPengajuanList] = useState(initialPengajuanList);
  const [arsipList, setArsipList] = useState(initialArsipList);
  const [proyekList] = useState(initialProyekTerminList);

  const handleApprove = (id: string, notes: string) => {
    alert(`Pengajuan ${id} berhasil DISETUJUI!${notes ? ` Catatan: ${notes}` : ''}`);
    setPengajuanList((prev) => prev.filter((p) => p.id !== id));
    setSelectedPengajuanId(null);
  };

  const handleReject = (id: string, notes: string) => {
    alert(`Pengajuan ${id} DITOLAK / DIMINTA REVISI. Catatan: ${notes}`);
    setPengajuanList((prev) => prev.filter((p) => p.id !== id));
    setSelectedPengajuanId(null);
  };

  const handleDeleteArsip = (id: string) => {
    setArsipList((prev) => prev.filter((a) => a.id !== id));
  };

  const handleViewRincianArsip = (item: ArsipItem) => {
    alert(`Membuka rincian berkas arsip:\nKode: ${item.kode}\nJudul: ${item.judulDokumen}\nLokasi: ${item.lokasiArsip}`);
  };

  // 1. Tampilan Login
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const selectedPengajuan = pengajuanList.find((p) => p.id === selectedPengajuanId);

  const mainContent = (
    <AppLayout
      role={role}
      currentTab={currentTab}
      forceMobile={isMobileFrame}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        setSelectedPengajuanId(null);
        setSelectedProyekId(null);
      }}
      onSwitchRole={(newRole) => {
        setRole(newRole);
        setCurrentTab('beranda');
        setSelectedPengajuanId(null);
        setSelectedProyekId(null);
      }}
      onLogout={() => setIsAuthenticated(false)}
    >
      {/* VIEW: ROLE DIREKTUR */}
      {role === 'direktur' && (
        selectedPengajuan ? (
          <DirekturDetailPage
            pengajuan={selectedPengajuan}
            onBack={() => setSelectedPengajuanId(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : currentTab === 'beranda' ? (
          <DirekturBerandaPage
            pengajuanList={pengajuanList}
            onSelectPengajuan={(id) => setSelectedPengajuanId(id)}
          />
        ) : (
          <DirekturArsipPage
            arsipList={arsipList}
            onDeleteArsip={handleDeleteArsip}
            onViewRincian={handleViewRincianArsip}
          />
        )
      )}

      {/* VIEW: ROLE SEKRETARIS DAN KEUANGAN */}
      {role === 'sekretaris' && (
        selectedPengajuan ? (
          <DirekturDetailPage
            pengajuan={selectedPengajuan}
            onBack={() => setSelectedPengajuanId(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : currentTab === 'beranda' ? (
          <SekretarisBerandaPage
            pengajuanList={pengajuanList}
            onSelectPengajuan={(id) => setSelectedPengajuanId(id)}
          />
        ) : currentTab === 'arsip' ? (
          <SekretarisArsipPage
            arsipList={arsipList}
            onDeleteArsip={handleDeleteArsip}
            onViewRincian={handleViewRincianArsip}
          />
        ) : currentTab === 'termin' ? (
          selectedProyekId ? (
            <SekretarisTerminDetailPage
              proyekId={selectedProyekId}
              onBack={() => setSelectedProyekId(null)}
            />
          ) : (
            <SekretarisTerminListPage
              proyekList={proyekList}
              onSelectProyek={(id) => setSelectedProyekId(id)}
            />
          )
        ) : (
          <SekretarisContactPage />
        )
      )}

      {/* VIEW: ROLE ADMIN LAPANGAN */}
      {role === 'admin_lapangan' && (
        currentTab === 'beranda' ? (
          selectedProyekId ? (
            <AdminProyekDetailPage
              proyekId={selectedProyekId}
              onBack={() => setSelectedProyekId(null)}
            />
          ) : (
            <AdminBerandaPage
              proyekList={proyekList}
              onSelectProyek={(id) => setSelectedProyekId(id)}
            />
          )
        ) : currentTab === 'kendala' ? (
          <AdminKendalaPage />
        ) : (
          <AdminArsipPage
            arsipList={arsipList}
            onViewRincian={handleViewRincianArsip}
          />
        )
      )}
    </AppLayout>
  );

  return (
    <div className={isMobileFrame ? 'bg-slate-800 min-h-screen py-8 flex items-center justify-center' : ''}>
      {/* Simulated Smartphone Frame (If enabled) */}
      {isMobileFrame ? (
        <div className="w-[390px] h-[844px] bg-[#F8FAFC] rounded-[48px] shadow-2xl border-[10px] border-slate-900 overflow-hidden relative flex flex-col">
          <div className="flex-1 overflow-y-auto flex flex-col">
            {mainContent}
          </div>
          {/* Home indicator bar */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black rounded-full pointer-events-none z-50" />
        </div>
      ) : (
        mainContent
      )}

      {/* Floating Toolbar Pengujian - posisi berbeda saat mobile frame mode */}
      <div className={`fixed ${isMobileFrame ? 'top-4 right-4' : 'bottom-4 right-4'} bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-2.5 shadow-2xl flex flex-wrap items-center gap-2 text-xs z-50`}>
        {/* Device View Mode Toggle */}
        <button
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            isMobileFrame
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Beralih antara tampilan HP dan Desktop"
        >
          {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isMobileFrame ? 'Buka Layar Penuh' : 'Simulasi Frame HP'}</span>
        </button>

        {/* Akses Role Selector */}
        <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
          <span className="font-bold text-gray-500">Role:</span>
          <button
            onClick={() => {
              setRole('direktur');
              setCurrentTab('beranda');
              setSelectedPengajuanId(null);
              setSelectedProyekId(null);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              role === 'direktur'
                ? 'bg-[#1877F2] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Direktur
          </button>
          <button
            onClick={() => {
              setRole('sekretaris');
              setCurrentTab('beranda');
              setSelectedPengajuanId(null);
              setSelectedProyekId(null);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              role === 'sekretaris'
                ? 'bg-[#1877F2] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Sekretaris
          </button>
          <button
            onClick={() => {
              setRole('admin_lapangan');
              setCurrentTab('beranda');
              setSelectedPengajuanId(null);
              setSelectedProyekId(null);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              role === 'admin_lapangan'
                ? 'bg-[#1877F2] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Lapangan
          </button>
        </div>

        {/* Shortcuts for current role */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setCurrentTab('beranda');
              setSelectedPengajuanId(null);
              setSelectedProyekId(null);
            }}
            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
          >
            Beranda
          </button>

          {role === 'admin_lapangan' && (
            <>
              <button
                onClick={() => {
                  setCurrentTab('beranda');
                  setSelectedProyekId('P001');
                }}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer font-medium text-blue-600"
              >
                Proyek/P001
              </button>
              <button
                onClick={() => {
                  setCurrentTab('kendala');
                  setSelectedProyekId(null);
                }}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
              >
                Kendala Proyek
              </button>
            </>
          )}

          <button
            onClick={() => {
              setCurrentTab('arsip');
              setSelectedPengajuanId(null);
              setSelectedProyekId(null);
            }}
            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
          >
            Arsip
          </button>
        </div>
      </div>
    </div>
  );
}
