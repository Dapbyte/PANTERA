import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/api';

const TOKEN_KEY = 'pantera_token';
const USER_KEY = 'pantera_user';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Otomatis menyematkan Bearer token jika tersedia di localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Menangani respons dan error terpusat
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      // Token tidak valid atau kedaluwarsa
      console.warn('[PANTERA API] Sesi autentikasi telah berakhir.');
      // Opsi: Hapus token lokal jika bukan saat request login
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// TOKEN & SESSION MANAGEMENT HELPERS
// ==========================================

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export function extractApiError(error: unknown, fallback = 'Terjadi kesalahan pada sistem.'): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const errors = error.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0];
      if (firstKey && Array.isArray(errors[firstKey]) && errors[firstKey].length > 0) {
        return errors[firstKey][0];
      }
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
