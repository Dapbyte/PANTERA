import React, { useState } from 'react';
import type { ArsipItem, TipeArsip } from '../../types/direktur';
import { Search, SlidersHorizontal, FolderArchive } from 'lucide-react';

interface AdminArsipItem extends ArsipItem {
  status?: 'Disetujui' | 'Ditolak';
}

interface AdminArsipPageProps {
  arsipList: ArsipItem[];
  onViewRincian: (item: ArsipItem) => void;
}

export const AdminArsipPage: React.FC<AdminArsipPageProps> = ({
  arsipList,
  onViewRincian,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipe, setSelectedTipe] = useState<string>('Semua');

  const adminArsipData: AdminArsipItem[] = arsipList.map((item, idx) => ({
    ...item,
    status: idx === 3 ? 'Ditolak' : 'Disetujui',
  }));

  const filteredList = adminArsipData.filter((item) => {
    const matchSearch =
      item.judulDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lokasiArsip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipe = selectedTipe === 'Semua' || item.tipe === selectedTipe;
    return matchSearch && matchTipe;
  });

  const getTipeBadge = (tipe: TipeArsip) => {
    switch (tipe) {
      case 'Berita acara':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Kwitansi':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Kontrak':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">Arsip</h1>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode atau judul..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1877F2] shadow-sm transition"
          />
        </div>

        <button
          onClick={() => setSelectedTipe('Semua')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
            selectedTipe === 'Semua'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Semua
        </button>

        <div className="relative group">
          <select
            value={selectedTipe}
            onChange={(e) => setSelectedTipe(e.target.value)}
            className="appearance-none bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 pr-7 rounded-full text-xs font-medium text-gray-700 focus:outline-none cursor-pointer transition"
          >
            <option value="Semua">Semua Tipe</option>
            <option value="Berita acara">Berita acara</option>
            <option value="Kwitansi">Kwitansi</option>
            <option value="Kontrak">Kontrak</option>
          </select>
          <SlidersHorizontal className="w-3 h-3 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>

        <button
          onClick={() => alert('Filter tanggal')}
          className="bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          <span>Tanggal</span>
        </button>

        <button
          onClick={() => alert('Filter lokasi fisik arsip.')}
          className="bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          <span>Lokasi Arsip</span>
        </button>
      </div>

      {/* =========================================================================
          1. MOBILE CARD VIEW (Matching Figma Image 3)
         ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#1877F2]">{item.kode}</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  item.status === 'Disetujui'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}
              >
                {item.status}
              </span>
            </div>

            <h4 className="font-bold text-gray-900 text-xs leading-snug">{item.judulDokumen}</h4>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{item.tanggal}</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${getTipeBadge(
                  item.tipe
                )}`}
              >
                {item.tipe}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <FolderArchive className="w-3.5 h-3.5 text-gray-400" />
              <span>{item.lokasiArsip}</span>
            </div>

            <button
              onClick={() => onViewRincian(item)}
              className="w-full py-2 bg-[#1877F2] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Rincian
            </button>
          </div>
        ))}
      </div>

      {/* =========================================================================
          2. DESKTOP TABLE VIEW
         ========================================================================= */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-white">
                <th className="py-3 px-4 pl-6">Kode</th>
                <th className="py-3 px-4">Judul Dokumen</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-center">Tipe</th>
                <th className="py-3 px-4">Lokasi Arsip</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition">
                  <td className="py-4 px-4 pl-6 font-semibold text-gray-800 font-mono text-[11px]">
                    {item.kode}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900 max-w-xs leading-relaxed">
                    {item.judulDokumen}
                  </td>
                  <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{item.tanggal}</td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[11px] font-medium ${getTipeBadge(
                        item.tipe
                      )}`}
                    >
                      {item.tipe}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-700 whitespace-nowrap">{item.lokasiArsip}</td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        item.status === 'Disetujui'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 pr-6 text-center whitespace-nowrap">
                    <button
                      onClick={() => onViewRincian(item)}
                      className="bg-[#1877F2] hover:bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition cursor-pointer shadow-sm"
                    >
                      Rincian
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 px-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <div>Menampilkan {filteredList.length} dari 142 arsip tersimpan</div>

        <div className="flex items-center gap-1.5">
          <button className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xs font-semibold shadow-sm">
            1
          </button>
          <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs font-medium">
            2
          </button>
          <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs font-medium">
            3
          </button>
          <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs font-medium">
            4
          </button>
          <span className="px-1 text-gray-400">..</span>
          <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs font-medium">
            36
          </button>
        </div>
      </div>
    </div>
  );
};
