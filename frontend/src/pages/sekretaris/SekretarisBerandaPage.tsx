import React from 'react';
import type { Pengajuan } from '../../types/direktur';
import { formatRupiah } from '../../lib/formatters';
import { ChevronRight } from 'lucide-react';

interface SekretarisBerandaPageProps {
  pengajuanList: Pengajuan[];
  onSelectPengajuan: (id: string) => void;
}

export const SekretarisBerandaPage: React.FC<SekretarisBerandaPageProps> = ({
  pengajuanList,
  onSelectPengajuan,
}) => {
  const daruratCount = pengajuanList.filter((p) => p.sifat === 'Darurat').length;
  const totalAntrean = pengajuanList.length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Title */}
      <h1 className="text-2xl font-bold text-[#1877F2] tracking-tight">Beranda</h1>

      {/* Ringkasan Header */}
      <div>
        <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3">
          Ringkasan
        </div>

        {/* 3 Summary Cards matching Sekretaris Figma Image 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Kas */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[125px]">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Total Kas
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">Rp 99 Googol</div>
            <div className="text-xs text-gray-400">Dana cukup untuk menangani 3 proyek terlambat</div>
          </div>

          {/* Card 2: Peringatan Dini (Blue Card) */}
          <div className="bg-[#1877F2] rounded-2xl p-5 shadow-md shadow-blue-500/20 text-white flex flex-col justify-between h-[125px] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                Peringatan Dini
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300/40"></span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">Perlu perhatian</div>
            <div className="text-xs text-white/80">3 Proyek berpotensi terlambat</div>
          </div>

          {/* Card 3: Antrean Validasi */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[125px]">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Antrean Validasi
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">{totalAntrean} pengajuan</div>
            <div>
              <span className="inline-block bg-[#1877F2] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                {daruratCount} pengajuan sifat darurat
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="pt-2">
        <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3">
          Menunggu Persetujuan
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-white">
                  <th className="py-3 px-4 pl-6">ID</th>
                  <th className="py-3 px-4">Tender</th>
                  <th className="py-3 px-4">Nama Proyek</th>
                  <th className="py-3 px-4 text-center">Sifat</th>
                  <th className="py-3 px-4">Total Estimasi</th>
                  <th className="py-3 px-4">Tanggal Pengajuan</th>
                  <th className="py-3 px-4 pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {pengajuanList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectPengajuan(item.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition text-xs text-gray-800 group"
                  >
                    <td className="py-3.5 px-4 pl-6 font-semibold text-gray-800">{item.id}</td>
                    <td className="py-3.5 px-4">{item.tender}</td>
                    <td className="py-3.5 px-4">{item.namaProyek}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          item.sifat === 'Darurat'
                            ? 'bg-rose-50 text-rose-500 border border-rose-100'
                            : 'bg-blue-50 text-blue-500 border border-blue-100'
                        }`}
                      >
                        {item.sifat}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {formatRupiah(item.totalEstimasi)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{item.tanggalPengajuan}</td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1877F2] transition inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
