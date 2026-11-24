import React, { useState } from 'react';
import { authService, type User } from '../../services';
import { extractApiError } from '../../lib/api';
import { FieldError } from './FieldError';
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from 'lucide-react';

interface ForceChangePasswordModalProps {
  user: User;
  onSuccess: (updated: User) => void;
  onLogout: () => void;
}

/**
 * Layar wajib ganti kata sandi sementara saat login pertama pekerja (GLB-13).
 */
export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  user,
  onSuccess,
  onLogout,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrs: { password?: string; confirm?: string } = {};
    if (password.length < 6) {
      nextErrs.password = 'Kata sandi baru minimal 6 karakter.';
    }
    if (confirmPassword !== password) {
      nextErrs.confirm = 'Konfirmasi kata sandi tidak sama.';
    }
    if (nextErrs.password || nextErrs.confirm) {
      setFieldErrors(nextErrs);
      return;
    }

    setFieldErrors({});
    setServerError(null);
    setSubmitting(true);
    try {
      const updated = await authService.changePassword({
        password,
        password_confirmation: confirmPassword,
      });
      onSuccess(updated);
    } catch (err: unknown) {
      setServerError(extractApiError(err, 'Gagal memperbarui kata sandi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-5 text-xs"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1877F2]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Atur Kata Sandi Pribadi</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
              Halo <strong>{user.nama}</strong>, Anda sedang masuk menggunakan kata sandi
              sementara. Demi keamanan akun, buat kata sandi baru sebelum melanjutkan.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-rose-700">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-semibold text-gray-700">Kata Sandi Baru</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2.5 pr-10 focus:border-[#1877F2] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                aria-label="Toggle password"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={fieldErrors.password} />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700">
              Ulangi Kata Sandi Baru
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              placeholder="Ketik ulang kata sandi baru"
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2.5 focus:border-[#1877F2] focus:bg-white focus:outline-none"
            />
            <FieldError message={fieldErrors.confirm} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100"
          >
            Keluar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-2.5 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Simpan &amp; Lanjutkan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
