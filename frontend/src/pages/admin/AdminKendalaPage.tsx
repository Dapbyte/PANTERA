import React, { useState } from 'react';
import { weatherDays } from '../../mock/adminLapanganData';
import {
  CloudRain,
  CloudLightning,
  Sun,
  CloudSun,
  Upload,
  Clock,
  Send,
  Cloud,
} from 'lucide-react';

export const AdminKendalaPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedKategori, setSelectedKategori] = useState('Cuaca');
  const [proyekPilihan, setProyekPilihan] = useState('Seluruh Proyek Tambang di Papua');
  const [deskripsi, setDeskripsi] = useState(
    'Hujan lebat disertai angin kencang menyebabkan elevasi air sungai meluap di area Pilar P6. Pekerjaan pengecoran dan perakitan rebar dihentikan sementara demi keselamatan.'
  );
  const [estimasiHari, setEstimasiHari] = useState('3');

  const kategoriList = ['Cuaca', 'Material', 'Tenaga kerja', 'Peralatan', 'Teknis'];

  const handleKirimLaporan = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Laporan kendala kategori "${selectedKategori}" untuk ${proyekPilihan} berhasil dikirim!`);
  };

  const renderWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'rain-storm':
        return <CloudLightning className="w-4 h-4 text-slate-700 mx-auto" />;
      case 'rain':
        return <CloudRain className="w-4 h-4 text-blue-500 mx-auto" />;
      case 'cloud-sun':
        return <CloudSun className="w-4 h-4 text-amber-500 mx-auto" />;
      case 'sun':
        return <Sun className="w-4 h-4 text-amber-500 mx-auto" />;
      default:
        return <Cloud className="w-4 h-4 text-slate-400 mx-auto" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
        Kendala Proyek
      </h1>

      {/* =========================================================================
          WEATHER PREDICTION:
          - Mobile View: 5-Column Grid Card matching Figma Image 6
          - Desktop View: Horizontal Timeline Strip
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Weather Prediction</h3>
            <p className="text-[10px] text-gray-400">Dates • Weather • Temp (°C) • Humid (%)</p>
          </div>
        </div>

        {/* 1. MOBILE 5-COLUMN GRID (Matching Figma Image 6) */}
        <div className="grid grid-cols-5 gap-2 sm:hidden text-center text-xs">
          {weatherDays.map((w) => (
            <div
              key={w.day}
              onClick={() => setSelectedDay(w.day)}
              className={`p-2 rounded-xl border transition cursor-pointer flex flex-col items-center justify-between space-y-1 ${
                selectedDay === w.day
                  ? 'bg-blue-100/70 border-blue-400 text-[#1877F2] font-bold shadow-sm'
                  : 'bg-slate-50/70 border-gray-100 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="font-bold text-xs">{w.day}</span>
              <div>{renderWeatherIcon(w.icon)}</div>
              <span className="font-mono text-[11px]">{w.temp}°</span>
              <span className="font-mono text-[10px] text-gray-400">{w.humid}%</span>
            </div>
          ))}
        </div>

        {/* 2. DESKTOP HORIZONTAL SCROLL STRIP */}
        <div className="hidden sm:block overflow-x-auto">
          <div className="min-w-[700px] space-y-3 text-xs">
            <div className="flex items-center">
              <span className="w-16 font-semibold bg-[#1877F2] text-white text-[10px] px-2.5 py-1 rounded-full text-center shrink-0">
                Dates
              </span>
              <div className="flex-1 grid grid-cols-[repeat(25,minmax(0,1fr))] gap-1 text-center font-semibold text-gray-700">
                {weatherDays.map((w) => (
                  <button
                    key={w.day}
                    type="button"
                    onClick={() => setSelectedDay(w.day)}
                    className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center transition cursor-pointer text-xs ${
                      selectedDay === w.day
                        ? 'bg-[#1877F2] text-white font-bold shadow-sm'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {w.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <span className="w-16 font-semibold bg-[#1877F2] text-white text-[10px] px-2.5 py-1 rounded-full text-center shrink-0">
                Weather
              </span>
              <div className="flex-1 grid grid-cols-[repeat(25,minmax(0,1fr))] gap-1 text-center">
                {weatherDays.map((w) => (
                  <div key={w.day} className="py-1">
                    {renderWeatherIcon(w.icon)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <span className="w-16 font-semibold bg-[#1877F2] text-white text-[10px] px-2.5 py-1 rounded-full text-center shrink-0">
                Temp
              </span>
              <div className="flex-1 grid grid-cols-[repeat(25,minmax(0,1fr))] gap-1 text-center text-[11px] text-gray-600 font-mono">
                {weatherDays.map((w) => (
                  <div key={w.day} className="py-0.5">
                    {w.temp}°
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <span className="w-16 font-semibold bg-[#1877F2] text-white text-[10px] px-2.5 py-1 rounded-full text-center shrink-0">
                Humid
              </span>
              <div className="flex-1 grid grid-cols-[repeat(25,minmax(0,1fr))] gap-1 text-center text-[11px] text-gray-600 font-mono">
                {weatherDays.map((w) => (
                  <div key={w.day} className="py-0.5">
                    {w.humid}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section (Mobile: Kendala Aktif di atas form sesuai Image 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Kendala Aktif Card */}
        <div className="lg:col-span-5 space-y-3 order-1 lg:order-2">
          <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            Kendala Aktif
          </div>

          <div className="bg-[#FFFDF5] border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-2.5">
            <span className="inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Kendala aktif
            </span>

            <h3 className="font-bold text-gray-900 text-sm leading-snug">
              Cuaca hujan ekstrem di area Pilar P6
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              Berdasarkan BMKG, akan terjadi hujan badai hari ini dan tiga hari kedepannya, siapkan
              rencana cadangan atau alihkan pekerjaan
            </p>

            <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-xs text-amber-800/80 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Terhenti 3 hari • Dilaporkan 18 Feb 2026</span>
            </div>
          </div>
        </div>

        {/* Lapor Kendala Baru Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm space-y-4 order-2 lg:order-1">
          <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase border-b border-gray-100 pb-3">
            Lapor Kendala Baru
          </div>

          <form onSubmit={handleKirimLaporan} className="space-y-4">
            {/* 1. Pilih Proyek */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Pilih Proyek</label>
              <select
                value={proyekPilihan}
                onChange={(e) => setProyekPilihan(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#1877F2] transition cursor-pointer"
              >
                <option value="Seluruh Proyek Tambang di Papua">
                  Seluruh Proyek Tambang di Papua
                </option>
                <option value="Air Mancur">Air Mancur (P001)</option>
                <option value="Kantin UPN">Kantin UPN (P002)</option>
                <option value="Warkop Kopdes">Warkop Kopdes (P003)</option>
              </select>
            </div>

            {/* 2. Kategori Kendala */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Kategori kendala</label>
              <div className="flex flex-wrap gap-2">
                {kategoriList.map((kat) => (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setSelectedKategori(kat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                      selectedKategori === kat
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-slate-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {kat}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Deskripsi Kendala */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Deskripsi kendala</label>
              <textarea
                rows={4}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-800 focus:outline-none focus:border-[#1877F2] leading-relaxed transition resize-none"
              />
            </div>

            {/* 4. Foto Bukti */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Foto bukti kendala</label>
              <div
                onClick={() => alert('Unggah foto bukti banjir/hujan')}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-slate-50 hover:border-blue-300 transition cursor-pointer flex items-center justify-center gap-2 text-xs text-gray-500"
              >
                <Upload className="w-4 h-4 text-[#1877F2]" />
                <span>Ketuk untuk mengunggah foto dokumentasi banjir/hujan</span>
              </div>
            </div>

            {/* 5. Estimasi Hari Terhenti */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Estimasi hari terhenti{' '}
                <span className="font-normal text-gray-400">
                  (Diisi otomatis oleh AI ketika deskripsi diberikan)
                </span>
              </label>
              <input
                type="text"
                value={estimasiHari}
                onChange={(e) => setEstimasiHari(e.target.value)}
                placeholder="Contoh: 3 hari"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#1877F2] hover:bg-blue-600 text-white font-medium text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim laporan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
