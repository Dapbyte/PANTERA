import React, { useState } from 'react';
import type { Pengajuan } from '../../types/direktur';
import { formatRupiah } from '../../lib/formatters';
import { Eye, CheckCircle2, ArrowLeft, FileText } from 'lucide-react';

interface DirekturDetailPageProps {
  pengajuan: Pengajuan;
  onBack: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
}

export const DirekturDetailPage: React.FC<DirekturDetailPageProps> = ({
  pengajuan,
  onBack,
  onApprove,
  onReject,
}) => {
  const [catatan, setCatatan] = useState('');

  const isRab = pengajuan.jenis === 'RAB';
  const items = pengajuan.items || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Bar: Title & Breadcrumb + Action Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#1877F2] tracking-tight">
            Beranda / {pengajuan.id}
          </h1>
        </div>

        <button
          onClick={() => alert(`Membuka dokumen asli untuk ${pengajuan.id}`)}
          className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Eye className="w-4 h-4 text-gray-600" />
          <span>Periksa Dokumen Asli</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
        {/* Header inside card */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">
            {isRab ? 'Daftar Item Material' : 'Preview Dokumen'}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-sky-50 text-sky-600 border border-sky-100">
              {isRab ? 'Tervalidasi Keuangan' : 'Tervalidasi Sekretaris'}
            </span>

            {pengajuan.sifat === 'Darurat' && (
              <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-rose-50 text-rose-500 border border-rose-100">
                Darurat
              </span>
            )}

            {pengajuan.isVendorTersedia && (
              <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                Vendor tersedia: Ya
              </span>
            )}
          </div>
        </div>

        {/* Content Section: Material Items Table OR Document Preview */}
        {isRab ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4 pl-0">Material</th>
                    <th className="py-2.5 px-4">Volume</th>
                    <th className="py-2.5 px-4">Harga</th>
                    <th className="py-2.5 px-4 text-right pr-0">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 pl-0 font-medium text-gray-900">{item.material}</td>
                      <td className="py-3 px-4 text-gray-600">{item.volume}</td>
                      <td className="py-3 px-4 text-gray-600">{formatRupiah(item.harga)}</td>
                      <td className="py-3 px-4 text-right pr-0 font-semibold text-gray-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-gray-50/70 font-semibold text-gray-900">
                    <td colSpan={3} className="py-3.5 px-4 pl-4 text-xs font-semibold">
                      Total estimasi ({items.length} item)
                    </td>
                    <td className="py-3.5 px-4 text-right pr-4 text-sm font-bold text-gray-900">
                      {formatRupiah(pengajuan.totalEstimasi)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {pengajuan.keteranganKhusus && (
              <div className="text-[11px] text-gray-400 italic mt-3">
                {pengajuan.keteranganKhusus}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Document Preview Box */}
            <div className="w-full min-h-[320px] bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1877F2] flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">
                {pengajuan.documentTitle || `${pengajuan.namaProyek} - Berkas ${pengajuan.jenis}.pdf`}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mb-4">
                Dokumen telah diverifikasi dan dibubuhi paraf elektronik oleh Sekretaris Operasional.
              </p>
              <button
                onClick={() => alert(`Membuka lampiran dokumen ${pengajuan.id}`)}
                className="bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-sm transition"
              >
                <Eye className="w-4 h-4 text-gray-600" />
                <span>Buka Tinjauan Lengkap PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Section: Info + Decision Notes + Actions */}
        <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Metadata */}
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between sm:justify-start sm:gap-12">
              <span className="text-gray-400 font-medium">Pengaju</span>
              <span className="font-semibold text-gray-900">{pengajuan.tender}</span>
            </div>

            {isRab && (
              <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                <span className="text-gray-400 font-medium">Sisa pagu RAB</span>
                <span className="font-bold text-[#1877F2] text-sm">
                  {formatRupiah(pengajuan.sisaPaguRab)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <span className="text-gray-400 font-medium">Status verifikasi</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{pengajuan.statusVerifikasi}</span>
              </span>
            </div>
          </div>

          {/* Right Decision Input + Action Buttons */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
              Catatan keputusan
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan alasan penolakan, catatan spesifikasi, atau instruksi percepatan logistik..."
              rows={3}
              className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#1877F2] transition placeholder-gray-400 text-gray-800"
            />
            <div className="text-[10px] text-gray-400">
              Wajib diisi jika menolak atau meminta revisi
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!catatan.trim()) {
                    alert('Harap isi catatan keputusan jika menolak atau meminta revisi.');
                    return;
                  }
                  onReject(pengajuan.id, catatan);
                }}
                className="bg-[#DC2626] hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-full text-xs transition cursor-pointer shadow-sm"
              >
                Tolak atau revisi
              </button>

              <button
                type="button"
                onClick={() => onApprove(pengajuan.id, catatan)}
                className="bg-[#1877F2] hover:bg-blue-600 text-white font-medium px-8 py-2.5 rounded-full text-xs transition cursor-pointer shadow-md shadow-blue-500/20"
              >
                Setujui
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
