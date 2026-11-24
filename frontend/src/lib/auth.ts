import type { UserRole } from '../types/api';

export interface AuthAccount {
  username: string;
  password: string;
  role: UserRole;
}

export const authAccounts: AuthAccount[] = [
  { username: 'direktur@pantera.id', password: 'password123', role: 'Direktur' },
  { username: 'keuangan@pantera.id', password: 'password123', role: 'SekretarisKeuangan' },
  { username: 'lapangan@pantera.id', password: 'password123', role: 'AdminLapangan' },
];

export function authenticate(rawUsername: string, password: string): AuthAccount | null {
  const username = rawUsername.trim().toLowerCase();
  return authAccounts.find((account) => account.username === username && account.password === password) ?? null;
}

export function getAccountByRole(role: UserRole): AuthAccount {
  return authAccounts.find((account) => account.role === role) ?? authAccounts[0];
}
