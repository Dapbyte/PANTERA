import React, { useState } from 'react';
import { bankContactList, tenderContactList } from '../../mock/sekretarisData';
import { Search, User2 } from 'lucide-react';

export const SekretarisContactPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Semua' | 'Bank' | 'Tender'>('Semua');

  const filteredBanks = bankContactList.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTenders = tenderContactList.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Title */}
      <h1 className="text-2xl font-bold text-[#1877F2] tracking-tight">Contact Person</h1>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama kontak"
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1877F2] shadow-sm w-64 transition"
          />
        </div>

        <button
          onClick={() => setFilterType('Semua')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'Semua'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Semua
        </button>

        <button
          onClick={() => setFilterType('Bank')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'Bank'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Bank
        </button>

        <button
          onClick={() => setFilterType('Tender')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'Tender'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tender
        </button>
      </div>

      {/* Section 1: PENGAJUAN KREDIT BANK */}
      {(filterType === 'Semua' || filterType === 'Bank') && (
        <div className="space-y-4">
          <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            Pengajuan Kredit Bank
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {filteredBanks.map((bank) => (
              <div
                key={bank.id}
                onClick={() => alert(`Menghubungi ${bank.name}`)}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition cursor-pointer flex flex-col items-center justify-center h-32 group"
              >
                {bank.shortName === 'BNI' && (
                  <div className="text-2xl font-black text-[#F15A24] tracking-tight group-hover:scale-105 transition">
                    BNI
                  </div>
                )}
                {bank.shortName === 'BCA' && (
                  <div className="text-2xl font-black text-[#005EAA] tracking-wider group-hover:scale-105 transition">
                    BCA
                  </div>
                )}
                {bank.shortName === 'BRI' && (
                  <div className="text-center group-hover:scale-105 transition">
                    <div className="text-xl font-black text-[#00529C]">BANK BRI</div>
                  </div>
                )}
                {bank.shortName.includes('btn') && (
                  <div className="text-center group-hover:scale-105 transition">
                    <span className="text-2xl font-bold text-[#E61E2A]">balé</span>
                    <span className="text-xs text-gray-400 block font-normal">by btn</span>
                  </div>
                )}
                {bank.shortName.includes('NEXT') && (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm group-hover:scale-105 transition">
                    NEXT
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: PENGAJUAN PERMOHONAN CAIR KE DINAS */}
      {(filterType === 'Semua' || filterType === 'Tender') && (
        <div className="space-y-4 pt-2">
          <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            Pengajuan Permohonan Cair Ke Dinas
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {filteredTenders.map((tender) => (
              <div
                key={tender.id}
                onClick={() => alert(`Menghubungi dinas / mitra: ${tender.name}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#1877F2] transition ring-4 ring-slate-50">
                  <User2 className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-semibold text-gray-800 leading-snug line-clamp-2">
                  {tender.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
