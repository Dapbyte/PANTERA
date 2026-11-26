import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { authService, type NotificationModule, type User, type UserRole } from './services';
import { AppLayout, type ActiveTab } from './components/layout/AppLayout';
import { RealtimeSyncProvider } from './context/RealtimeSyncContext';
import { useRealtimeSync } from './context/realtimeSyncStore';
import { ForceChangePasswordModal, SkeletonDashboard } from './components/ui';

// Halaman Direktur
import { DirekturBerandaPage } from './pages/direktur/DirekturBerandaPage';
import { DirekturDetailPage } from './pages/direktur/DirekturDetailPage';
import { DirekturProyekPage } from './pages/direktur/DirekturProyekPage';
import { DirekturUsersPage } from './pages/direktur/DirekturUsersPage';
import { DirekturArsipPage } from './pages/direktur/DirekturArsipPage';

// Halaman Sekretaris / Keuangan
import { SekretarisBerandaPage } from './pages/sekretaris/SekretarisBerandaPage';
import { SekretarisValidasiPage } from './pages/sekretaris/SekretarisValidasiPage';
import { SekretarisArsipPage } from './pages/sekretaris/SekretarisArsipPage';
import { SekretarisTerminListPage } from './pages/sekretaris/SekretarisTerminListPage';
import { SekretarisTerminDetailPage } from './pages/sekretaris/SekretarisTerminDetailPage';
import { SekretarisContactPage } from './pages/sekretaris/SekretarisContactPage';

// Halaman Admin Lapangan
import { AdminBerandaPage } from './pages/admin/AdminBerandaPage';
import { AdminProyekDetailPage } from './pages/admin/AdminProyekDetailPage';
import { AdminKendalaPage } from './pages/admin/AdminKendalaPage';
import { AdminArsipPage } from './pages/admin/AdminArsipPage';

const ROLE_PREFIX: Record<UserRole, string> = {
  Direktur: 'direktur',
  SekretarisKeuangan: 'sekretaris',
  AdminLapangan: 'admin',
};

const ROLE_TABS: Record<UserRole, ActiveTab[]> = {
  Direktur: ['beranda', 'proyek', 'users', 'arsip'],
  SekretarisKeuangan: ['beranda', 'arsip', 'termin', 'contact'],
  AdminLapangan: ['beranda', 'kendala', 'arsip'],
};

function getPathForRoleTab(role: UserRole, tab: ActiveTab): string {
  const allowed = ROLE_TABS[role];
  const safeTab = allowed.includes(tab) ? tab : 'beranda';
  return `/${ROLE_PREFIX[role]}/${safeTab}`;
}

function resolveTabFromPath(role: UserRole, pathname: string): { tab: ActiveTab; needsCanonical: boolean } {
  const segments = pathname.split('/').filter(Boolean);
  const expectedPrefix = ROLE_PREFIX[role];
  if (segments[0] !== expectedPrefix) {
    return { tab: 'beranda', needsCanonical: true };
  }
  const rawTab = segments[1] ?? 'beranda';
  if (role === 'SekretarisKeuangan' && rawTab === 'validasi') {
    return { tab: 'beranda', needsCanonical: false };
  }
  if (ROLE_TABS[role].includes(rawTab as ActiveTab)) {
    return { tab: rawTab as ActiveTab, needsCanonical: false };
  }
  return { tab: 'beranda', needsCanonical: true };
}

interface AuthenticatedShellProps {
  user: User;
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

function AuthenticatedShell({
  user,
  currentTab,
  onSelectTab,
  onUserUpdated,
  onLogout,
}: AuthenticatedShellProps) {
  const [selectedPengajuanId, setSelectedPengajuanId] = useState<number | null>(null);
  const [selectedProyekId, setSelectedProyekId] = useState<number | null>(null);
  const { markTabSeen } = useRealtimeSync();

  useEffect(() => {
    void markTabSeen(currentTab as NotificationModule);
  }, [currentTab, markTabSeen]);

  const resetNavigation = () => {
    setSelectedPengajuanId(null);
    setSelectedProyekId(null);
  };

  const handleSelectTab = (tab: ActiveTab) => {
    onSelectTab(tab);
    resetNavigation();
    void markTabSeen(tab as NotificationModule);
  };

  const role = user.peran;

  return (
    <>
      {user.must_change_password && (
        <ForceChangePasswordModal
          user={user}
          onSuccess={(updated) => onUserUpdated(updated)}
          onLogout={onLogout}
        />
      )}

      <AppLayout
        user={user}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onLogout={onLogout}
      >
        {/* VIEW: ROLE DIREKTUR */}
        {role === 'Direktur' &&
          (selectedPengajuanId !== null ? (
            <DirekturDetailPage
              idRequest={selectedPengajuanId}
              onBack={() => setSelectedPengajuanId(null)}
              onDecisionSuccess={() => setSelectedPengajuanId(null)}
            />
          ) : currentTab === 'beranda' ? (
            <DirekturBerandaPage
              onSelectPengajuan={(id) => setSelectedPengajuanId(id)}
              onGoToProyek={() => handleSelectTab('proyek')}
            />
          ) : currentTab === 'proyek' ? (
            <DirekturProyekPage />
          ) : currentTab === 'users' ? (
            <DirekturUsersPage currentUserId={user.id_pengguna} />
          ) : (
            <DirekturArsipPage />
          ))}

        {/* VIEW: ROLE SEKRETARIS DAN KEUANGAN */}
        {role === 'SekretarisKeuangan' &&
          (selectedPengajuanId !== null ? (
            <SekretarisValidasiPage
              idRequest={selectedPengajuanId}
              onBack={() => setSelectedPengajuanId(null)}
              onValidated={() => setSelectedPengajuanId(null)}
            />
          ) : currentTab === 'beranda' ? (
            <SekretarisBerandaPage onSelectPengajuan={(id) => setSelectedPengajuanId(id)} />
          ) : currentTab === 'arsip' ? (
            <SekretarisArsipPage />
          ) : currentTab === 'termin' ? (
            selectedProyekId !== null ? (
              <SekretarisTerminDetailPage
                proyekId={selectedProyekId}
                onBack={() => setSelectedProyekId(null)}
                onOpenBankCoordination={() => handleSelectTab('contact')}
              />
            ) : (
              <SekretarisTerminListPage onSelectProyek={(id) => setSelectedProyekId(id)} />
            )
          ) : (
            <SekretarisContactPage />
          ))}

        {/* VIEW: ROLE ADMIN LAPANGAN */}
        {role === 'AdminLapangan' &&
          (currentTab === 'beranda' ? (
            selectedProyekId !== null ? (
              <AdminProyekDetailPage
                proyekId={selectedProyekId}
                onBack={() => setSelectedProyekId(null)}
                onGoToKendala={() => handleSelectTab('kendala')}
              />
            ) : (
              <AdminBerandaPage onSelectProyek={(id) => setSelectedProyekId(id)} />
            )
          ) : currentTab === 'kendala' ? (
            <AdminKendalaPage />
          ) : (
            <AdminArsipPage />
          ))}
      </AppLayout>
    </>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [checkingSession, setCheckingSession] = useState(() => authService.isAuthenticated());
  const [currentTab, setCurrentTab] = useState<ActiveTab>(() => {
    const u = authService.getCurrentUser();
    if (!u || typeof window === 'undefined') return 'beranda';
    return resolveTabFromPath(u.peran, window.location.pathname).tab;
  });

  const clearSessionState = useCallback(() => {
    queryClient.clear();
    setCurrentTab('beranda');
    setUser(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  }, [queryClient]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSessionState();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pantera_token' && !e.newValue) {
        clearSessionState();
      }
    };
    window.addEventListener('pantera:unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('pantera:unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorage);
    };
  }, [clearSessionState]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const resolved = resolveTabFromPath(user.peran, window.location.pathname);
    if (resolved.needsCanonical) {
      window.history.replaceState(null, '', getPathForRoleTab(user.peran, resolved.tab));
    }

    const handlePopState = () => {
      const next = resolveTabFromPath(user.peran, window.location.pathname);
      setCurrentTab(next.tab);
      if (next.needsCanonical) {
        window.history.replaceState(null, '', getPathForRoleTab(user.peran, next.tab));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      return;
    }

    let active = true;
    authService
      .getMe()
      .then((freshUser) => {
        if (!active) return;
        setUser(freshUser);
        if (typeof window !== 'undefined') {
          const resolved = resolveTabFromPath(freshUser.peran, window.location.pathname);
          setCurrentTab(resolved.tab);
          if (resolved.needsCanonical) {
            window.history.replaceState(
              null,
              '',
              getPathForRoleTab(freshUser.peran, resolved.tab)
            );
          }
        }
      })
      .catch(() => {
        if (active) clearSessionState();
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [clearSessionState]);

  const handleSelectTab = (tab: ActiveTab) => {
    setCurrentTab(tab);
    if (user && typeof window !== 'undefined') {
      const nextPath = getPathForRoleTab(user.peran, tab);
      if (window.location.pathname !== nextPath) {
        window.history.pushState(null, '', nextPath);
      }
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    queryClient.clear();
    setCurrentTab('beranda');
    setUser(loggedInUser);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', getPathForRoleTab(loggedInUser.peran, 'beranda'));
    }
  };

  const handleLogout = () => {
    void authService.logout().finally(() => {
      clearSessionState();
    });
  };

  if (checkingSession && !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <RealtimeSyncProvider enabled={Boolean(user)} activeTab={user ? (currentTab as NotificationModule) : null}>
      {user ? (
        <AuthenticatedShell
          user={user}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onUserUpdated={(updated) => setUser(updated)}
          onLogout={handleLogout}
        />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </RealtimeSyncProvider>
  );
}
