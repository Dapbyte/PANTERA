import React, { useState } from 'react';
import type { ProyekTermin } from '../../types/sekretaris';
import { Search, SlidersHorizontal, ChevronRight, Plus } from 'lucide-react';

interface AdminBerandaPageProps {
  proyekList: ProyekTermin[];
  onSelectProyek: (id: string) => void;
}

export const AdminBerandaPage: React.FC<AdminBerandaPageProps> = ({
  proyekList,
  onSelectProyek,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  const filteredList = proyekList.filter((item) => {
    const matchSearch =
      item.namaProyek.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'Semua' || item.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Title & Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-[#1877F2] sm:text-2xl">
          Daftar Proyek
        </h1>
        <button
          onClick={() => window.alert('Membuka formulir pendaftaran proyek baru...')}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-[#1877F2]" />
          <span>Unggah Proyek Baru</span>
        </button>
      </div>

      {/* Ringkasan */}
      <div>
        <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2">
          Ringkasan
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Proyek */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-1">
            <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Proyek
            </div>
            <div className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
              1000 Proyek!
            </div>
          </div>

          {/* Card 2: Estimasi Keterlambatan */}
          <div className="bg-[#1877F2] rounded-2xl p-4 shadow-md shadow-blue-500/20 text-white flex flex-col gap-1 relative">
            <div className="flex items-start justify-between gap-1">
              <span className="text-[9px] font-semibold text-white/80 uppercase tracking-wider leading-tight">
                Proyek Dengan Estimasi Keterlambatan
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300/40 shrink-0 mt-0.5" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight leading-tight">0 Proyek</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode atau judul..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1877F2] shadow-sm transition"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStatus('Semua')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedStatus === 'Semua'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Semua
          </button>

          <button
            onClick={() => alert('Filter tipe proyek')}
            className="bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />
            <span>Tipe</span>
          </button>

          <button
            onClick={() => alert('Filter tanggal')}
            className="bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />
            <span>Tanggal</span>
          </button>

          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 pr-7 rounded-full text-xs font-medium text-gray-700 focus:outline-none cursor-pointer transition"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aman">Aman</option>
              <option value="Tidak Aman">Tidak Aman</option>
            </select>
            <SlidersHorizontal className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Daftar Proyek — Card list (mobile-first, works on desktop too) */}
      <div>
        <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2">
          Menunggu Persetujuan
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectProyek(item.id)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.99] transition cursor-pointer"
            >
              {/* Row 1: ID + Status badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-[#1877F2] font-mono">{item.id}</span>
                <span
                  className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'Aman'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-rose-50 text-rose-500 border border-rose-100'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Row 2: Nama + Tender */}
              <div className="mb-2.5">
                <h4 className="font-bold text-gray-900 text-sm leading-snug">{item.namaProyek}</h4>
                <p className="text-xs text-gray-500">{item.tender}</p>
              </div>

              {/* Row 3: Termin info + Arrow */}
              <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                    Posisi Termin
                  </div>
                  <div className="text-xs font-semibold text-gray-800">{item.posisiTermin}</div>
                </div>

                <div className="space-y-0.5 text-right">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                    Termin Selanjutnya
                  </div>
                  <div className="text-xs font-medium text-gray-700">{item.terminSelanjutnya}</div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination hint */}
        {filteredList.length > 0 && (
          <div className="text-center pt-3">
            <p className="text-[10px] text-gray-400">
              Menampilkan {filteredList.length} dari {proyekList.length} proyek tersimpan
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
