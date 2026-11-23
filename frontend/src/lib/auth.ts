import type { UserRole } from '../components/layout/AppLayout';

export interface AuthAccount {
  username: string;
  password: string;
  role: UserRole;
}

/**
 * Daftar akun demo untuk pemisahan akses per peran.
 * Setiap peran (Direktur, Sekretaris/Keuangan, Admin Proyek) memiliki
 * kredensial login sendiri dan tidak saling bertukar peran.
 */
export const authAccounts: AuthAccount[] = [
  { username: 'direktur', password: 'direktur123', role: 'direktur' },
  { username: 'sekretaris', password: 'sekretaris123', role: 'sekretaris' },
  { username: 'proyek', password: 'proyek123', role: 'admin_lapangan' },
];

export function authenticate(rawUsername: string, password: string): AuthAccount | null {
  const username = rawUsername.trim().toLowerCase();
  return authAccounts.find((account) => account.username === username && account.password === password) ?? null;
}

export function getAccountByRole(role: UserRole): AuthAccount {
  return authAccounts.find((account) => account.role === role) ?? authAccounts[0];
}
