import React, { useState } from 'react';
import {
  initialProgresFotoList,
  initialRequestMaterialList,
  initialChecklistBerkas,
} from '../../mock/adminLapanganData';
import { formatRupiah } from '../../lib/formatters';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Upload,
  ChevronRight,
  FileText,
  Calculator,
  Image as ImageIcon,
  X,
  Send,
  Flag,
} from 'lucide-react';

interface AdminProyekDetailPageProps {
  proyekId: string;
  onBack: () => void;
}

export const AdminProyekDetailPage: React.FC<AdminProyekDetailPageProps> = ({
  proyekId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'progres' | 'material' | 'termin'>('progres');

  // State form lapor progres
  const [zonaKerja, setZonaKerja] = useState('Tangerang Barat');
  const [capaian, setCapaian] = useState('68,5');
  const [deskripsi, setDeskripsi] = useState(
    'Pengecoran segmen pier head P6 selesai 100%. Pemasangan bekisting untuk segmen lanjutan siap dikerjakan besok pagi dengan 14 orang pekerja.'
  );

  // State Modal Popup Ajuan Material
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sifatPengajuan, setSifatPengajuan] = useState<'Rutin Mingguan' | 'Darurat'>('Darurat');
  const [modalVolume1, setModalVolume1] = useState('500');
  const [modalVolume2, setModalVolume2] = useState('150');

  // List request material & checklist berkas
  const [requestList] = useState(initialRequestMaterialList);
  const [checklistBerkas] = useState(initialChecklistBerkas);

  const handleSimpanProgres = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Laporan Progres Fisik (${capaian}%) berhasil disimpan untuk zona ${zonaKerja}!`);
  };

  const handleKirimAjuanMaterial = () => {
    alert('Pengajuan material nomor tiket REQ-2026-090 berhasil dikirim ke bagian Keuangan!');
    setIsModalOpen(false);
  };

  // Termin data with Rp amounts (from Figma: Rp 1,62 M / Rp 2,16 M / Rp 1,62 M)
  const terminData = [
    { label: 'Termin 1', badge: 'SP2D cair', badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100', amount: 'Rp 1,62 M', date: '20 Oktober 2027', active: false },
    { label: 'Termin 2', badge: 'Siap serah', badgeClass: 'bg-amber-400 text-amber-950', amount: 'Rp 2,16 M', date: '20 Oktober 2029', active: true },
    { label: 'Termin 3', badge: 'Belum siap', badgeClass: 'bg-gray-100 text-gray-500', amount: 'Rp 1,62 M', date: '20 Oktober 2030', active: false },
  ];

  return (
    <div className="space-y-5">
      {/* Title & Back Arrow */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
          title="Kembali ke Daftar Proyek"
        >
          <ArrowLeft className="w-5 h-5 text-[#1877F2]" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          <span className="text-gray-400 font-normal">Proyek/</span>
          <span className="text-[#1877F2]">{proyekId}</span>
        </h1>
      </div>

      {/* Top 3 Termin Progress Cards — sesuai Figma dengan nominal Rp */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {terminData.map((t) => (
          <div
            key={t.label}
            className={`rounded-2xl p-3 sm:p-5 flex flex-col gap-1 sm:gap-2 shadow-sm ${
              t.active
                ? 'bg-[#1877F2] text-white shadow-blue-400/30'
                : 'bg-white border border-gray-100 text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className={`text-[11px] sm:text-xs font-semibold ${t.active ? 'text-white' : 'text-gray-600'}`}>
                {t.label}
              </span>
              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${t.badgeClass}`}>
                {t.badge}
              </span>
            </div>
            <div className={`text-base sm:text-2xl font-extrabold tracking-tight leading-tight ${t.active ? 'text-white' : 'text-gray-900'}`}>
              {t.amount}
            </div>
            <div className={`text-[10px] sm:text-xs ${t.active ? 'text-white/80' : 'text-gray-400'}`}>
              {t.date}
            </div>
          </div>
        ))}
      </div>

      {/* 3 Sub-tabs (Input Progres Fisik | Request Material | Ajuan Termin) */}
      <div className="flex items-center gap-1.5 sm:gap-2 pt-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('progres')}
          className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'progres'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Input Progres Fisik
        </button>

        <button
          onClick={() => setActiveTab('material')}
          className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'material'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Request Material
        </button>

        <button
          onClick={() => setActiveTab('termin')}
          className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'termin'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Ajuan Termin
        </button>
      </div>

      {/* =========================================================================
          TAB 1: INPUT PROGRES FISIK
         ========================================================================= */}
      {activeTab === 'progres' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Kolom Kiri: Laporan Progres Terbaru (Foto) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
              Laporan Progres Terbaru
            </div>

            <div className="space-y-3">
              {initialProgresFotoList.map((foto) => (
                <div
                  key={foto.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer"
                >
                  {/* Photo placeholder dengan gradient + label */}
                  <div className="relative h-40 w-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-1">
                        <Camera className="w-8 h-8 text-white/40 mx-auto" />
                        <div className="text-white/50 text-[10px]">Foto Lapangan</div>
                      </div>
                    </div>
                    {/* Try loading image, fallback ke gradient */}
                    <img
                      src={foto.imageUrl}
                      alt={foto.judul}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 font-extrabold text-xs px-2.5 py-1 rounded-full shadow z-10">
                      {foto.capaian}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-0.5">
                    <h4 className="font-semibold text-gray-800 text-xs leading-snug">{foto.judul}</h4>
                    <p className="text-[11px] text-gray-400">{foto.tanggal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kolom Kanan: Form Lapor Progres */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                Form Lapor Progres Pekerjaan
              </h3>
              <span className="text-[11px] font-mono text-gray-400">Formulir Harian #LH-842</span>
            </div>

            <form onSubmit={handleSimpanProgres} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-600">Zona kerja</label>
                  <select
                    value={zonaKerja}
                    onChange={(e) => setZonaKerja(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#1877F2] transition cursor-pointer"
                  >
                    <option value="Tangerang Barat">Tangerang Barat</option>
                    <option value="Tangerang Timur">Tangerang Timur</option>
                    <option value="Area Pilar P6">Area Pilar P6</option>
                    <option value="Abutment A1">Abutment A1</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-600">
                    Capaian kumulatif (%)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={capaian}
                      onChange={(e) => setCapaian(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-gray-800 focus:outline-none focus:border-[#1877F2] font-semibold transition"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-medium">
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#1877F2]">
                    <Flag className="h-3 w-3" />
                    <span>Target Termin 2: 70,0%</span>
                  </div>
                </div>
              </div>

              {/* Upload Foto */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">
                  Unggah foto bukti lapangan
                </label>
                <div
                  onClick={() => alert('Pilih foto dokumentasi lapangan untuk diunggah')}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-slate-50 hover:border-blue-300 transition cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1877F2] flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    Ambil foto atau unggah dokumentasi lapangan
                  </div>
                  <div className="text-[10px] text-gray-400">Maksimal 10 MB (JPG, PNG)</div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">Deskripsi pekerjaan</label>
                <textarea
                  rows={4}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-800 focus:outline-none focus:border-[#1877F2] leading-relaxed transition resize-none"
                />
              </div>

              {/* Footer Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-100">
                <div className="text-[11px] text-gray-400">
                  <span>Jika kendala menghambat, laporkan di tab </span>
                  <span className="text-[#1877F2] font-semibold cursor-pointer hover:underline">Kendala</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#1877F2] hover:bg-blue-600 text-white font-medium text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan laporan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: REQUEST MATERIAL (Mobile Cards Image 7 & Desktop Table Image 3)
         ========================================================================= */}
      {activeTab === 'material' && (
        <div className="space-y-4">
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 px-5 py-2.5 rounded-full text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#1877F2]" />
              <span>Unggah Ajuan Material</span>
            </button>
          </div>

          {/* 1. MOBILE CARD LIST (Sesuai Figma Image 7) */}
          <div className="block md:hidden space-y-3">
            {requestList.map((item) => (
              <div
                key={item.id}
                onClick={() => alert(`Rincian pengajuan material ${item.id}`)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.99] transition cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-blue-600">{item.id}</span>
                  <span className="text-[11px] text-gray-400">{item.tanggal}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">{item.pengaju}</h4>
                    <p className="text-[10px] text-gray-400">{item.rolePengaju}</p>
                  </div>
                  <span
                    className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                      item.sifat === 'Darurat'
                        ? 'bg-rose-50 text-rose-500 border border-rose-100'
                        : 'bg-blue-50 text-blue-500 border border-blue-100'
                    }`}
                  >
                    {item.sifat}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                      Total Estimasi
                    </div>
                    <div className="font-bold text-gray-900 text-sm">
                      {formatRupiah(item.totalEstimasi)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        item.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : item.status === 'Tervalidasi Keuangan'
                          ? 'bg-sky-50 text-sky-600 border border-sky-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {item.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 2. DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-white">
                    <th className="py-3 px-4 pl-6">ID</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Pengaju</th>
                    <th className="py-3 px-4 text-center">Sifat</th>
                    <th className="py-3 px-4">Total Estimasi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="w-12 py-3 pl-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80 text-xs text-gray-800">
                  {requestList.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 pl-6 font-mono font-medium text-blue-600">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{item.tanggal}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{item.pengaju}</div>
                        <div className="text-[10px] text-gray-400">{item.rolePengaju}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            item.sifat === 'Darurat'
                              ? 'bg-rose-50 text-rose-500 border border-rose-100'
                              : 'bg-blue-50 text-blue-500 border border-blue-100'
                          }`}
                        >
                          {item.sifat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {formatRupiah(item.totalEstimasi)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block whitespace-nowrap px-3 py-0.5 rounded-full text-[10px] font-medium ${
                            item.status === 'Pending'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : item.status === 'Tervalidasi Keuangan'
                              ? 'bg-sky-50 text-sky-600 border border-sky-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          ● {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-2 pr-5 text-right">
                        <ChevronRight className="w-4 h-4 text-gray-400 inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: AJUAN TERMIN (Responsive Checklist & Alert: Mobile Image 2)
         ========================================================================= */}
      {activeTab === 'termin' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">
                Dokumen persyaratan Termin 2 (70%)
              </h3>
              <span className="text-xs font-semibold text-blue-600">
                Progress berkas: 75% (3 dari 4 lengkap)
              </span>
            </div>

            {/* Checklist items */}
            <div className="divide-y divide-gray-100">
              {checklistBerkas.map((berkas) => (
                <div
                  key={berkas.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {berkas.status === 'Terverifikasi' ? (
                      <div className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {berkas.type === 'doc' && <FileText className="w-4 h-4 text-blue-500" />}
                        {berkas.type === 'calc' && <Calculator className="w-4 h-4 text-purple-500" />}
                        {berkas.type === 'photo' && <ImageIcon className="w-4 h-4 text-emerald-500" />}
                        <span className="font-semibold text-gray-900 text-xs">{berkas.judul}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {berkas.kode ? `${berkas.kode} • ${berkas.tanggal}` : berkas.subtext}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-9 sm:pl-0">
                    {berkas.canUpload && (
                      <button
                        onClick={() => alert(`Mengunggah berkas: ${berkas.judul}`)}
                        className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs px-3.5 py-1.5 rounded-full font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah berkas</span>
                      </button>
                    )}

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-medium ${
                        berkas.status === 'Terverifikasi'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {berkas.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Alert Banner matching Image 2 */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start sm:items-center gap-3 text-amber-900 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <span>Tenggat 5 hari lagi, berkas belum lengkap. Estimasi kerugian Rp 145 jt.</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP MODAL / BOTTOM SHEET UNGGAH AJUAN MATERIAL (Figma Mobile Image 1)
         ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-8 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Sheet Handle for Mobile */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto sm:hidden mb-2" />

            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Unggah Ajuan Material</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nomor Tiket & Sifat Buttons */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 font-mono">
                Nomor tiket:{' '}
                <span className="font-bold text-gray-900">REQ-2026-090 (otomatis)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSifatPengajuan('Rutin Mingguan')}
                  className={`py-2 px-3 rounded-full text-xs font-medium text-center transition cursor-pointer ${
                    sifatPengajuan === 'Rutin Mingguan'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Rutin Mingguan
                </button>

                <button
                  type="button"
                  onClick={() => setSifatPengajuan('Darurat')}
                  className={`py-2 px-3 rounded-full text-xs font-medium text-center transition cursor-pointer ${
                    sifatPengajuan === 'Darurat'
                      ? 'bg-rose-50 text-rose-500 border border-rose-200 font-semibold shadow-sm'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ● Darurat
                </button>
              </div>
            </div>

            {/* Material Card 1 with Volume Red Border & Alert */}
            <div className="bg-slate-50/70 border border-gray-100 rounded-2xl p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Material</label>
                <input
                  type="text"
                  defaultValue="Semen PCC 50 kg"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Volume</label>
                  <input
                    type="text"
                    value={modalVolume1}
                    onChange={(e) => setModalVolume1(e.target.value)}
                    className="w-full bg-white border-2 border-rose-400 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Satuan</label>
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700">
                    <option value="sak">sak</option>
                    <option value="m3">m³</option>
                    <option value="btg">btg</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Harga</label>
                <input
                  type="text"
                  defaultValue="Rp 75.000"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold text-[10px] uppercase">Subtotal</span>
                <span className="font-bold text-gray-900 font-mono">Rp 37.500.000</span>
              </div>
            </div>

            {/* Alert Volume melebihi sisa pagu RAB */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 space-y-1">
              <div className="font-semibold text-rose-700">
                Volume melebihi sisa pagu RAB. Kurangi jumlahnya.
              </div>
              <div className="font-bold text-[11px] text-rose-600">Sisa Kuota: 320 sak</div>
            </div>

            {/* Material Card 2 */}
            <div className="bg-slate-50/70 border border-gray-100 rounded-2xl p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Material</label>
                <input
                  type="text"
                  defaultValue="Semen PCC 50 kg"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Volume</label>
                  <input
                    type="text"
                    value={modalVolume2}
                    onChange={(e) => setModalVolume2(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Satuan</label>
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700">
                    <option value="btg">btg</option>
                    <option value="sak">sak</option>
                    <option value="m3">m³</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Harga</label>
                <input
                  type="text"
                  defaultValue="Rp 160.000"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold text-[10px] uppercase">Subtotal</span>
                <span className="font-bold text-gray-900 font-mono">Rp 24.000.000</span>
              </div>
            </div>

            {/* + Tambah item */}
            <button
              type="button"
              onClick={() => alert('Tambah item material')}
              className="w-full py-2.5 rounded-full border border-gray-300 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
            >
              + Tambah item
            </button>

            {/* Total & Action Buttons */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                <span>Total estimasi:</span>
                <span className="text-base font-extrabold font-mono">Rp 61.500.000</span>
              </div>

              <button
                type="button"
                onClick={handleKirimAjuanMaterial}
                className="w-full py-3 rounded-full bg-[#1877F2] hover:bg-blue-600 text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim pengajuan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 rounded-full border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
