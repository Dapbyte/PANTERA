import React, { useState } from 'react';
import { PanteraLogo } from '../components/common/PanteraLogo';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-900 p-4 font-sans">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundColor: '#0b1524',
          backgroundImage:
            'radial-gradient(circle at 15% 10%, rgba(24, 119, 242, 0.55), transparent 45%), radial-gradient(circle at 85% 90%, rgba(24, 119, 242, 0.32), transparent 50%), linear-gradient(135deg, #0f2747 0%, #0b1524 100%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[430px] rounded-3xl border border-white/50 bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <PanteraLogo variant="dark" className="mb-3 h-20 w-20" />
          <h1 className="text-2xl font-black tracking-[0.18em] text-slate-900">PANTERA</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Pemantauan Arsip, Termin &amp; Risiko
          </p>
          <p className="text-[11px] text-slate-400">PT. Djasipa Mitra Perkasa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-semibold text-slate-800">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b border-slate-300 bg-transparent py-2 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none"
              placeholder="Masukkan username"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-slate-300 bg-transparent py-2 pr-10 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none"
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1.5 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  window.alert('Silakan hubungi administrator IT untuk reset password.');
                }}
                className="text-xs font-medium text-slate-600 transition hover:text-[#1877F2]"
              >
                Lupa Password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 active:scale-[0.99] cursor-pointer"
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-7 flex items-center justify-center gap-1.5 border-t border-dashed border-slate-200 pt-4 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Akses internal terbatas — PT. Djasipa Mitra Perkasa</span>
        </div>
      </div>
    </div>
  );
};
