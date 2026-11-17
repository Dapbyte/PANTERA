import React, { useState } from 'react';
import {
  initialBerkasTerminList,
  kurvaSData,
} from '../../mock/sekretarisData';
import {
  ArrowLeft,
  Download,
  Phone,
  AlertTriangle,
  FileCheck2,
  CalendarClock,
  Paperclip,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface SekretarisTerminDetailPageProps {
  proyekId: string;
  onBack: () => void;
}

export const SekretarisTerminDetailPage: React.FC<SekretarisTerminDetailPageProps> = ({
  proyekId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'peringatan' | 'berkas' | 'penagihan'>('peringatan');
  const [berkasList] = useState(initialBerkasTerminList);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Title & Back Arrow */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
          title="Kembali ke Daftar Proyek"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-[#1877F2] tracking-tight">
          Proyek / {proyekId}
        </h1>
      </div>

      {/* 3 Top Termin Cards (matching Figma Images 6, 7, 8) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Termin 1 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Termin 1</span>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              SP2D cair
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">Rp 1,62 M</div>
          <div className="text-xs text-gray-400">20 Oktober 2027</div>
        </div>

        {/* Termin 2 (Active Blue Card) */}
        <div className="bg-[#1877F2] rounded-2xl p-5 shadow-md shadow-blue-500/20 text-white flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Termin 2</span>
            <span className="bg-amber-400 text-amber-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
              Siap serah
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">Rp 2,16 M</div>
          <div className="text-xs text-white/80">20 Oktober 2029</div>
        </div>

        {/* Termin 3 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Termin 3</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
              Belum siap
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">Rp 1,62 M</div>
          <div className="text-xs text-gray-400">20 Oktober 2030</div>
        </div>
      </div>

      {/* Tabs Navigation (Peringatan dini | Berkas | Penagihan) */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => setActiveTab('peringatan')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'peringatan'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Peringatan dini
        </button>

        <button
          onClick={() => setActiveTab('berkas')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'berkas'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Berkas
        </button>

        <button
          onClick={() => setActiveTab('penagihan')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'penagihan'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Penagihan
        </button>
      </div>

      {/* TAB 1: PERINGATAN DINI (Image 6) */}
      {activeTab === 'peringatan' && (
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => alert('Mengunduh dokumen performa proyek...')}
              className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>Unduh Dokumen Performa</span>
            </button>

            <button
              onClick={() => alert('Menghubungi Bank penyedia kredit...')}
              className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-gray-600" />
              <span>Hubungi Bank</span>
            </button>
          </div>

          {/* 3 Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Deviasi Progres
              </div>
              <div className="text-2xl font-bold text-gray-900">-1,5 poin</div>
              <div className="text-xs text-gray-400">Realisasi 68.5% vs target 70%</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Estimasi Hari Telat
              </div>
              <div className="text-2xl font-bold text-gray-900">3 hari</div>
              <div className="text-xs text-gray-400">Tenggat 28 Feb 2026</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Dampak Ke Kas
              </div>
              <div className="text-2xl font-bold text-gray-900">Rp 145 jt</div>
              <div className="text-xs text-gray-400">Potensi penundaan pencairan</div>
            </div>
          </div>

          {/* Grid: Kurva S + Kendala Penyebab */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Kurva Target vs Realisasi Fisik (Recharts) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-800 text-sm">Kurva target vs realisasi fisik</h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-gray-400"></span>
                    <span>Target 70%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#1877F2] font-medium">
                    <span className="w-3 h-0.5 bg-[#1877F2]"></span>
                    <span>Realisasi 68,5%</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kurvaSData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="minggu" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="realisasi" stroke="#1877F2" strokeWidth={2.5} dot={{ r: 3, fill: '#1877F2' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">ⓘ Target batas akhir Termin 2: Minggu ke-7 (Feb 2026)</span>
                <span className="bg-rose-50 text-rose-500 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                  Gap fisik: -1,5%
                </span>
              </div>
            </div>

            {/* Right: Kendala Penyebab */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-800 text-sm">Kendala penyebab</h3>
                <span className="text-xs text-gray-400 cursor-pointer hover:underline">Audit lapangan</span>
              </div>

              {/* Item 1: Alert Warning */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-900 leading-snug">
                    Cuaca hujan ekstrem di area Pilar P6 • Terhenti 3 hari
                  </div>
                  <span className="inline-block bg-amber-200/60 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Kendala aktif
                  </span>
                </div>
              </div>

              {/* Item 2: Dampak Administrasi */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 flex items-start gap-3">
                <CalendarClock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-900">
                    Dampak administrasi termin
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Pengecoran cap pier pilar 6 tertunda dari jadwal 21 Feb 2026. Berkas opname teknis
                    bersama konsultan pengawas dijadwalkan ulang ke tanggal 26 Feb 2026.
                  </p>
                </div>
              </div>

              {/* Item 3: Rekomendasi Percepatan */}
              <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3.5 flex items-start gap-3">
                <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-900">
                    Rekomendasi percepatan
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Penambahan jam kerja (shift malam) untuk curing beton dan perakitan rebar agar gap
                    -1,5% tuntas sebelum pengajuan berkas SPP termin 2.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Pelapor: Tim Lapangan Wilayah Barat</span>
                <span className="text-[#1877F2] font-semibold cursor-pointer hover:underline flex items-center">
                  Detail kendala <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BERKAS (Image 7) */}
      {activeTab === 'berkas' && (
        <div className="space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[115px]">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Total Berkas
              </div>
              <div className="text-2xl font-bold text-gray-900">100 berkas</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[115px]">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Berkas Selesai
              </div>
              <div className="text-2xl font-bold text-emerald-600">80 Berkas</div>
              <div className="text-xs text-gray-400">Selesai 80% dari total berkas</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-[115px]">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Berkas Kurang
              </div>
              <div className="text-2xl font-bold text-rose-500">20 Berkas</div>
              <div className="text-xs text-gray-400">Kurang 20% dari total berkas</div>
            </div>
          </div>

          {/* Table of Berkas matching Image 7 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-white">
                    <th className="py-3 px-4 pl-6">Kode</th>
                    <th className="py-3 px-4">Judul Dokumen</th>
                    <th className="py-3 px-4">Tenggat</th>
                    <th className="py-3 px-4 text-center">Tipe</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Status Waktu</th>
                    <th className="py-3 px-4 text-center pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                  {berkasList.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-4 px-4 pl-6 font-semibold font-mono text-[11px]">
                        {item.kode}
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">{item.judulDokumen}</td>
                      <td className="py-4 px-4 text-gray-600">{item.tenggat}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-medium border border-emerald-100">
                          {item.tipe}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-[10px] font-medium border border-rose-100">
                          {item.statusPengajuan}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-medium ${
                            item.statusWaktu === 'Terlambat'
                              ? 'bg-rose-50 text-rose-500 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {item.statusWaktu}
                        </span>
                      </td>
                      <td className="py-4 px-4 pr-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => alert(`Rincian berkas ${item.kode}`)}
                            className="bg-[#1877F2] hover:bg-blue-600 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer"
                          >
                            Rincian
                          </button>
                          <button
                            onClick={() => alert(`Menghubungi PJ untuk ${item.judulDokumen}`)}
                            className="bg-[#DC2626] hover:bg-red-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer"
                          >
                            Hubungi PJ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 px-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <div>Menampilkan 3 dari 142 arsip tersimpan</div>
              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xs font-semibold">
                  1
                </button>
                <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs">
                  2
                </button>
                <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs">
                  3
                </button>
                <span className="px-1 text-gray-400">...</span>
                <button className="w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs">
                  36
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENAGIHAN (Image 8) */}
      {activeTab === 'penagihan' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-4">
          {/* Recipient */}
          <div className="border border-gray-200 rounded-full px-5 py-2.5 text-xs text-gray-700 bg-white">
            <span className="font-medium text-gray-500">Penerima:</span>{' '}
            <span className="font-semibold text-gray-900">PT Sinar Jaya</span>
          </div>

          {/* Subject */}
          <div className="border border-gray-200 rounded-full px-5 py-2.5 text-xs text-gray-700 bg-white">
            <span className="font-medium text-gray-500">Subjek:</span>{' '}
            <span className="font-semibold text-gray-900">PEMINJAMAN DANA KONSTRUKSI</span>
          </div>

          {/* Message Area */}
          <div className="border border-gray-200 rounded-2xl p-5 min-h-[280px] flex flex-col justify-between bg-white">
            <textarea
              placeholder="Ketikkan Pesan"
              rows={6}
              className="w-full text-xs text-gray-800 focus:outline-none placeholder-gray-400 resize-none"
            />

            {/* Bottom Bar: Attachment + Alert Badge matching Image 8 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-800 transition rounded-lg hover:bg-gray-100 cursor-pointer"
                title="Lampirkan berkas"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <span className="bg-rose-50 text-rose-500 border border-rose-200 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
                Berkas Belum Lengkap, Pengajuan tidak bisa dilakukan
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
