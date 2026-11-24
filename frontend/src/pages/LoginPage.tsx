import React, { useState } from 'react';
import { PanteraLogo } from '../components/common/PanteraLogo';
import { FieldError } from '../components/ui';
import { authService, type User } from '../services';
import { extractApiError } from '../lib/api';
import { Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

const demoHints = [
  { role: 'Direktur', email: 'direktur@pantera.id', password: 'password123' },
  { role: 'Sekretaris & Keuangan', email: 'keuangan@pantera.id', password: 'password123' },
  { role: 'Admin Lapangan', email: 'lapangan@pantera.id', password: 'password123' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Masukkan alamat email perusahaan yang valid.';
    }
    if (!password) {
      errs.password = 'Kata sandi wajib diisi.';
    }
    if (errs.email || errs.password) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setError(null);
    setLoading(true);

    try {
      const result = await authService.login({
        email: trimmedEmail,
        password,
      });
      onLoginSuccess(result.user);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Email atau password salah. Periksa kembali akun Anda.'));
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (hint: (typeof demoHints)[number]) => {
    setEmail(hint.email);
    setPassword(hint.password);
    setFieldErrors({});
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-900 p-4 font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundColor: '#0b1524',
          backgroundImage:
            'radial-gradient(circle at 15% 10%, rgba(24, 119, 242, 0.55), transparent 45%), radial-gradient(circle at 85% 90%, rgba(24, 119, 242, 0.32), transparent 50%), linear-gradient(135deg, #0f2747 0%, #0b1524 100%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-[430px] rounded-3xl border border-white/50 bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <PanteraLogo
            variant="dark"
            showText
            className="mb-2 h-14 w-14"
            textClassName="text-2xl tracking-[0.18em]"
          />
          <p className="mt-1 text-xs font-medium text-slate-500">
            Pemantauan Arsip, Termin &amp; Risiko
          </p>
          <p className="text-[11px] text-slate-400">PT. Djasipa Mitra Perkasa</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
              Email Perusahaan
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
                setError(null);
              }}
              className={`w-full border-b bg-transparent py-2 text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none ${
                fieldErrors.email
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-[#1877F2]'
              }`}
              placeholder="nama@pantera.id"
              autoComplete="email"
            />
            <FieldError message={fieldErrors.email} />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  setError(null);
                }}
                className={`w-full border-b bg-transparent py-2 pr-10 text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none ${
                  fieldErrors.password
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-[#1877F2]'
                }`}
                placeholder="Masukkan password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1.5 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={fieldErrors.password} />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi…</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-7 border-t border-dashed border-slate-200 pt-4">
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Akun standar per peran (klik untuk isi)
          </div>
          <div className="space-y-1">
            {demoHints.map((hint) => (
              <button
                key={hint.email}
                type="button"
                onClick={() => fillCredentials(hint)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                <span className="font-semibold text-slate-600">{hint.role}</span>
                <span className="font-mono text-slate-400">{hint.email}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-dashed border-slate-200 pt-4 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Akses internal terbatas — PT. Djasipa Mitra Perkasa</span>
        </div>
      </div>
    </div>
  );
};
