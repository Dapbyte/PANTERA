import React, { useState } from 'react';
import { PanteraLogo } from '../components/common/PanteraLogo';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('Prof. Dr. H. Eagan R. A. S.Kom., M.Kom., S.T., M.T.');
  const [password, setPassword] = useState('Assalamualaikum gaji halal dua digit');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 overflow-hidden font-sans">
      {/* Background with dusk skyline gradient matching Figma */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-90"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(59, 130, 246, 0.45), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
        }}
      />

      {/* Login Card */}
      <div className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl p-8 pt-10 border border-white/40 backdrop-blur-sm z-10">
        {/* Top Logo */}
        <div className="flex justify-center mb-8 pb-4 border-b border-dashed border-gray-200">
          <PanteraLogo variant="dark" className="w-20 h-20" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-base font-bold text-gray-900 tracking-tight">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b border-gray-300 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1877F2] transition placeholder-gray-400 bg-transparent"
              placeholder="Masukkan username"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-base font-bold text-gray-900 tracking-tight">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-gray-300 py-2 pr-10 text-sm text-gray-800 focus:outline-none focus:border-[#1877F2] transition placeholder-gray-400 bg-transparent"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 transition"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Silakan hubungi administrator IT untuk reset password.');
                }}
                className="text-xs font-medium text-gray-700 hover:text-[#1877F2] transition"
              >
                Lupa Password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-[#1877F2] hover:bg-blue-600 active:scale-[0.99] text-white font-medium py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <span>Masuk ke Dashboard Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
