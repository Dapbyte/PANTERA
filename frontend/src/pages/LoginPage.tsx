import React, { useState } from 'react';
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
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-br from-[#0F5CD2] via-[#1877F2] to-[#3B8EF7] font-sans">
      {/* Soft ambient highlights on Brand Blue canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,255,255,0.18),transparent_42%),radial-gradient(circle_at_85%_82%,rgba(12,68,175,0.45),transparent_50%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-center gap-6 px-4 py-7 sm:px-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-10">
        {/* Left Hero Brand Block */}
        <section className="flex flex-col items-center text-center text-white lg:col-span-6 lg:items-start lg:text-left">
          <div className="inline-flex items-center gap-1">
            <img
              src="/intro/PANTERA_white.png"
              alt="Logo PANTERA"
              className="h-10 w-auto object-contain sm:h-12"
            />
            <span className="-translate-y-0.5 text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
              ANTERA
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:mt-8 lg:text-5xl">
            Halo, Selamat Datang!
          </h1>

          <p className="mt-2 text-sm font-semibold text-white/95 sm:text-base">
            Pemantauan Arsip, Termin &amp; Risiko Proyek
          </p>

          <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-white/80 sm:block">
            Platform operasional terpadu PT. Djasipa Mitra Perkasa untuk pengajuan material,
            progres fisik lapangan, early warning Kurva S, penagihan SP2D, dan arsip hibrida.
          </p>

          <div className="mt-8 hidden items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm lg:inline-flex">
            <img
              src="/intro/DJASIPA_white.png"
              alt="DMP"
              className="h-6 w-auto object-contain opacity-95"
            />
            <div className="text-left leading-tight">
              <div className="text-[9px] font-semibold uppercase tracking-[0.26em] text-white/75">
                Powered By
              </div>
              <div className="text-xs font-semibold text-white">PT. Djasipa Mitra Perkasa</div>
            </div>
          </div>
        </section>

        {/* Right Floating White Login Card */}
        <section className="flex justify-center lg:col-span-6 lg:justify-end">
          <div className="w-full max-w-[440px] rounded-[2rem] bg-white p-6 shadow-2xl shadow-blue-950/25 sm:p-10">
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Masuk ke Akun Anda
              </h2>
              <p className="mt-1.5 text-xs text-slate-500">
                Gunakan email perusahaan PT. Djasipa Mitra Perkasa untuk melanjutkan.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
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
                  className={`w-full rounded-full border bg-slate-50/70 px-5 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:bg-white focus:outline-none ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#1877F2]'
                  }`}
                  placeholder="Email Perusahaan (nama@pantera.id)"
                  autoComplete="email"
                />
                <div className="mt-1 px-2">
                  <FieldError message={fieldErrors.email} />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
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
                    className={`w-full rounded-full border bg-slate-50/70 px-5 py-3 pr-12 text-sm text-slate-800 transition placeholder:text-slate-400 focus:bg-white focus:outline-none ${
                      fieldErrors.password
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 focus:border-[#1877F2]'
                    }`}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-1 px-2">
                  <FieldError message={fieldErrors.password} />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#0F5CD2] disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Atau isi akun demo
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-2">
              {demoHints.map((hint) => (
                <button
                  key={hint.email}
                  type="button"
                  onClick={() => fillCredentials(hint)}
                  className="flex w-full items-center justify-between gap-2 rounded-full border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-left text-[11px] text-slate-600 transition hover:border-[#1877F2]/40 hover:bg-blue-50/60 hover:text-slate-900"
                >
                  <span className="truncate font-semibold text-slate-700">{hint.role}</span>
                  <span className="shrink-0 font-mono text-slate-400">{hint.email}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#1877F2]" />
              <span>Akses internal terbatas — PT. Djasipa Mitra Perkasa</span>
            </div>
          </div>
        </section>

        {/* Mobile Powered By Footer */}
        <footer className="flex items-center justify-center gap-2 pb-1 text-white/85 lg:hidden">
          <img
            src="/intro/DJASIPA_white.png"
            alt="DMP"
            className="h-5 w-auto object-contain opacity-95"
          />
          <span className="text-[11px] font-medium">PT. Djasipa Mitra Perkasa</span>
        </footer>
      </div>
    </div>
  );
};
