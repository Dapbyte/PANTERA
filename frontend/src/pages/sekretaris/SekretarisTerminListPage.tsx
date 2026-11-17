import React, { useState } from 'react';
import type { ProyekTermin } from '../../types/sekretaris';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react';

interface SekretarisTerminListPageProps {
  proyekList: ProyekTermin[];
  onSelectProyek: (id: string) => void;
}

export const SekretarisTerminListPage: React.FC<SekretarisTerminListPageProps> = ({
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
    <div className="space-y-6 max-w-6xl">
      {/* Title */}
      <h1 className="text-2xl font-bold text-[#1877F2] tracking-tight">Daftar Proyek</h1>

      {/* Ringkasan Header matching Figma Image 5 */}
      <div>
        <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3">
          Ringkasan
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
          {/* Card 1: Total Proyek */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[125px]">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Total Proyek
            </div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">1000 Proyek!</div>
          </div>

          {/* Card 2: Proyek Dengan Estimasi Keterlambatan (Blue) */}
          <div className="bg-[#1877F2] rounded-2xl p-6 shadow-md shadow-blue-500/20 text-white flex flex-col justify-between h-[125px] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                Proyek Dengan Estimasi Keterlambatan
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300/40"></span>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">0 Proyek</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
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

        <button
          onClick={() => setSelectedStatus('Semua')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
            selectedStatus === 'Semua'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Semua
        </button>

        <button
          onClick={() => alert('Filter tipe proyek')}
          className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          <span>Tipe</span>
        </button>

        <button
          onClick={() => alert('Filter tanggal termin')}
          className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          <span>Tanggal</span>
        </button>

        <div className="relative group">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 pr-7 rounded-full text-xs font-medium text-gray-700 focus:outline-none cursor-pointer transition"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Tidak Aman">Tidak Aman</option>
          </select>
          <SlidersHorizontal className="w-3 h-3 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Table Section */}
      <div className="pt-1">
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
                  <th className="py-3 px-4">Posisi Termin</th>
                  <th className="py-3 px-4">Termin Selanjutnya</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 text-xs text-gray-800">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectProyek(item.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4 pl-6 font-semibold text-gray-800">{item.id}</td>
                    <td className="py-3.5 px-4">{item.tender}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">{item.namaProyek}</td>
                    <td className="py-3.5 px-4 text-gray-700">{item.posisiTermin}</td>
                    <td className="py-3.5 px-4 text-gray-700">{item.terminSelanjutnya}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-medium ${
                          item.status === 'Aman'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-500 border border-rose-100'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
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
