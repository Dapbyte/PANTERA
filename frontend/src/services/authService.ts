import { api, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api';
import type {
  ApiResponse,
  LoginPayload,
  LoginResponseData,
  UpdateProfilePayload,
  User,
  UserRole,
} from '../types/api';

const USER_KEY = 'pantera_user';

export const authService = {
  /**
   * Login pengguna (SD-01).
   * Otomatis menyimpan token dan user info di localStorage.
   */
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    const { data } = response.data;

    // Simpan sesi autentikasi
    setAuthToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data;
  },

  /**
   * Logout pengguna aktif dan revoke token di backend.
   */
  async logout(): Promise<void> {
    try {
      await api.post<ApiResponse<null>>('/auth/logout');
    } finally {
      // Pastikan token lokal selalu dibersihkan walau request jaringan gagal
      removeAuthToken();
    }
  },

  /**
   * Mengambil data profil pengguna yang sedang login.
   */
  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    const user = response.data.data;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Memperbarui profil pengguna (nama, kontak, password, lokasi tugas).
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/auth/profile', payload);
    const updatedUser = response.data.data;
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Mendapatkan user yang tersimpan di localStorage secara sinkron.
   */
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  /**
   * Mengecek apakah pengguna memiliki token aktif.
   */
  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  /**
   * Mendapatkan peran pengguna saat ini.
   */
  getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user?.peran ?? null;
  },
};
