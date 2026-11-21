import React, { useState } from 'react';
import type { ArsipItem, TipeArsip } from '../../types/direktur';
import { Search, SlidersHorizontal, Trash2 } from 'lucide-react';

interface SekretarisArsipItem extends ArsipItem {
  status?: 'Disetujui' | 'Ditolak';
}

interface SekretarisArsipPageProps {
  arsipList: ArsipItem[];
  onDeleteArsip: (id: string) => void;
  onViewRincian: (item: ArsipItem) => void;
}

export const SekretarisArsipPage: React.FC<SekretarisArsipPageProps> = ({
  arsipList,
  onDeleteArsip,
  onViewRincian,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipe, setSelectedTipe] = useState<string>('Semua');

  // Augment with status matching Figma Image 4
  const sekretarisArsipData: SekretarisArsipItem[] = arsipList.map((item, idx) => ({
    ...item,
    status: idx === 3 ? 'Ditolak' : 'Disetujui',
  }));

  const filteredList = sekretarisArsipData.filter((item) => {
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
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-[#1877F2] tracking-tight">Arsip</h1>

      {/* Search & Filter Bar matching Figma */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode atau judul..."
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1877F2] shadow-sm w-64 transition"
          />
        </div>

        {/* Filter Pills */}
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
            className="appearance-none bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 pr-7 rounded-full text-xs font-medium text-gray-700 focus:outline-none cursor-pointer transition"
          >
            <option value="Semua">Semua Tipe</option>
            <option value="Berita acara">Berita acara</option>
            <option value="Kwitansi">Kwitansi</option>
            <option value="Kontrak">Kontrak</option>
          </select>
          <SlidersHorizontal className="w-3 h-3 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>

        <button
          onClick={() => alert('Filter tanggal dapat disesuaikan')}
          className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          <span>Tanggal</span>
        </button>

        <button
          onClick={() => alert('Filter lokasi fisik arsip (lemari / rak / divisi).')}
          className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          <span>Lokasi Arsip</span>
        </button>
      </div>

      {/* Table Section with STATUS Column (Image 4) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-white">
                <th className="w-[114px] py-3 pl-5 pr-2">Kode</th>
                <th className="py-3 px-2">Judul Dokumen</th>
                <th className="w-[86px] py-3 px-2">Tanggal</th>
                <th className="hidden w-[98px] py-3 px-2 text-center xl:table-cell">Tipe</th>
                <th className="hidden w-[136px] py-3 px-2 xl:table-cell">Lokasi Arsip</th>
                <th className="w-[80px] py-3 px-2 text-center">Status</th>
                <th className="w-[150px] py-3 pl-2 pr-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition">
                  <td className="py-4 pl-5 pr-2 font-mono text-[11px] font-semibold text-gray-800">
                    {item.kode}
                  </td>
                  <td className="py-4 px-2 font-medium leading-relaxed text-gray-900">
                    {item.judulDokumen}
                  </td>
                  <td className="py-4 px-2 text-gray-600 whitespace-nowrap">{item.tanggal}</td>
                  <td className="hidden py-4 px-2 text-center xl:table-cell">
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
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 pl-2 pr-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewRincian(item)}
                        className="bg-[#1877F2] hover:bg-blue-600 text-white text-[11px] px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shadow-sm whitespace-nowrap"
                      >
                        Rincian
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus arsip ${item.kode}?`)) {
                            onDeleteArsip(item.id);
                          }
                        }}
                        className="bg-[#DC2626] hover:bg-red-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shadow-sm flex items-center gap-1 whitespace-nowrap"
                        title="Hapus arsip"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 px-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
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
            <span className="px-1 text-gray-400">...</span>
            <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs font-medium">
              36
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
