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
    <div className="space-y-5">
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
                className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
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
                className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${getTipeBadge(
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
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <th className="w-[118px] py-3 pl-4 pr-2">Kode</th>
                <th className="py-3 px-2">Judul Dokumen</th>
                <th className="w-[88px] py-3 px-2">Tanggal</th>
                <th className="w-[100px] py-3 px-2 text-center">Tipe</th>
                <th className="hidden w-[148px] py-3 px-2 xl:table-cell">Lokasi Arsip</th>
                <th className="w-[84px] py-3 px-2 text-center">Status</th>
                <th className="w-[84px] py-3 pl-2 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {filteredList.map((item) => (
                <tr key={item.id} className="transition hover:bg-blue-50/40">
                  <td className="py-4 pl-4 pr-2 font-mono text-[11px] font-semibold text-gray-800">
                    {item.kode}
                  </td>
                  <td className="py-4 px-2 font-medium leading-relaxed text-gray-900">
                    {item.judulDokumen}
                  </td>
                  <td className="whitespace-nowrap py-4 px-2 text-gray-600">{item.tanggal}</td>
                  <td className="py-4 px-2 text-center">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${getTipeBadge(
                        item.tipe
                      )}`}
                    >
                      {item.tipe}
                    </span>
                  </td>
                  <td className="hidden py-4 px-2 text-gray-700 xl:table-cell">{item.lokasiArsip}</td>
                  <td className="py-4 px-2 text-center">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        item.status === 'Disetujui'
                          ? 'border border-emerald-100 bg-emerald-50 text-emerald-600'
                          : 'border border-rose-100 bg-rose-50 text-rose-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 pl-2 pr-4 text-center">
                    <button
                      onClick={() => onViewRincian(item)}
                      className="rounded-lg bg-[#1877F2] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-600 cursor-pointer"
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
