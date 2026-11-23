import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import type { AuthAccount } from './lib/auth';
import { AppLayout, type ActiveTab } from './components/layout/AppLayout';

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

export default function App() {
  // Sesi login: tiap peran memiliki akun sendiri (direktur, sekretaris, proyek).
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [currentTab, setCurrentTab] = useState<ActiveTab>('beranda');

  // State navigasi detail
  const [selectedPengajuanId, setSelectedPengajuanId] = useState<string | null>(null);
  const [selectedProyekId, setSelectedProyekId] = useState<string | null>(null);

  // Data state
  const [pengajuanList, setPengajuanList] = useState(initialPengajuanList);
  const [arsipList, setArsipList] = useState(initialArsipList);
  const [proyekList] = useState(initialProyekTerminList);

  const resetNavigation = () => {
    setSelectedPengajuanId(null);
    setSelectedProyekId(null);
  };

  const handleSelectTab = (tab: ActiveTab) => {
    setCurrentTab(tab);
    resetNavigation();
  };

  const handleLoginSuccess = (loggedIn: AuthAccount) => {
    setAccount(loggedIn);
    setCurrentTab('beranda');
    resetNavigation();
  };

  const handleLogout = () => {
    setAccount(null);
    setCurrentTab('beranda');
    resetNavigation();
  };

  const handleApprove = (id: string, notes: string) => {
    window.alert(`Pengajuan ${id} berhasil DISETUJUI!${notes ? ` Catatan: ${notes}` : ''}`);
    setPengajuanList((prev) => prev.filter((p) => p.id !== id));
    setSelectedPengajuanId(null);
  };

  const handleReject = (id: string, notes: string) => {
    window.alert(`Pengajuan ${id} DITOLAK / DIMINTA REVISI. Catatan: ${notes}`);
    setPengajuanList((prev) => prev.filter((p) => p.id !== id));
    setSelectedPengajuanId(null);
  };

  const handleDeleteArsip = (id: string) => {
    setArsipList((prev) => prev.filter((a) => a.id !== id));
  };

  const handleViewRincianArsip = (item: ArsipItem) => {
    window.alert(
      `Membuka rincian berkas arsip:\nKode: ${item.kode}\nJudul: ${item.judulDokumen}\nLokasi: ${item.lokasiArsip}`,
    );
  };

  if (!account) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const role = account.role;
  const selectedPengajuan = pengajuanList.find((p) => p.id === selectedPengajuanId);

  return (
    <AppLayout
      role={role}
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      onLogout={handleLogout}
    >
      {/* VIEW: ROLE DIREKTUR */}
      {role === 'direktur' &&
        (selectedPengajuan ? (
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
        ))}

      {/* VIEW: ROLE SEKRETARIS DAN KEUANGAN */}
      {role === 'sekretaris' &&
        (selectedPengajuan ? (
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
        ))}

      {/* VIEW: ROLE ADMIN LAPANGAN */}
      {role === 'admin_lapangan' &&
        (currentTab === 'beranda' ? (
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
          <AdminArsipPage arsipList={arsipList} onViewRincian={handleViewRincianArsip} />
        ))}
    </AppLayout>
  );
}
