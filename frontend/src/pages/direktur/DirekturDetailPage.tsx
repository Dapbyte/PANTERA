import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { materialService, type RequestMaterial } from '../../services';
import { extractApiError } from '../../lib/api';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import { BackButton, FieldError, SkeletonDashboard } from '../../components/ui';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Receipt,
} from 'lucide-react';

interface DirekturDetailPageProps {
  idRequest: number;
  onBack: () => void;
  onDecisionSuccess: () => void;
}

export const DirekturDetailPage: React.FC<DirekturDetailPageProps> = ({
  idRequest,
  onBack,
  onDecisionSuccess,
}) => {
  const queryClient = useQueryClient();
  const { confirm, showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alasanError, setAlasanError] = useState<string | null>(null);

  const {
    data: pengajuan,
    isLoading,
    error: queryError,
  } = useQuery<RequestMaterial>({
    queryKey: ['material-requests', 'detail', idRequest],
    queryFn: () => materialService.getDetail(idRequest),
  });

  const handleDecision = async (keputusan: 'Disetujui' | 'Revisi') => {
    if (keputusan === 'Revisi' && !catatan.trim()) {
      setAlasanError('Alasan penolakan / permintaan revisi wajib diisi.');
      return;
    }

    if (keputusan === 'Disetujui' && pengajuan?.melebihi_rab) {
      const ok = await confirm({
        title: 'Pengajuan Melebihi Sisa Pagu RAB',
        message:
          'Total pengajuan ini melebihi sisa pagu RAB proyek. Tetap setujui dan terbitkan Purchase Order?',
        confirmLabel: 'Ya, Setujui & Terbitkan PO',
        cancelLabel: 'Periksa Lagi',
        variant: 'danger',
      });
      if (!ok) return;
    }

    setAlasanError(null);
    setError(null);
    setSubmitting(true);

    try {
      await materialService.approve(idRequest, {
        keputusan,
        catatan_direktur: catatan.trim() || undefined,
        alasan_penolakan: keputusan === 'Revisi' ? catatan.trim() : undefined,
      });
      showToast({
        type: 'success',
        message:
          keputusan === 'Disetujui'
            ? 'Pengajuan disetujui dan PO berhasil diterbitkan.'
            : 'Pengajuan dikembalikan untuk revisi.',
      });
      await queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await triggerSyncNow();
      onDecisionSuccess();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal menyimpan keputusan Direktur.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (!pengajuan) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} label="Kembali" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {queryError
            ? extractApiError(queryError, 'Data pengajuan tidak ditemukan.')
            : 'Data pengajuan tidak ditemukan.'}
        </div>
      </div>
    );
  }

  const items = pengajuan.item_material ?? [];
  const sisaPagu = Number(pengajuan.sisa_pagu_rab ?? pengajuan.proyek?.rab?.sisa_pagu ?? 0);
  const totalEstimasi = Number(pengajuan.total_estimasi ?? 0);
  const isCompleted = pengajuan.status_approval === 'Selesai';
  const showOverRabWarning =
    !isCompleted &&
    (Boolean(pengajuan.melebihi_rab) || (totalEstimasi > 0 && totalEstimasi > sisaPagu));
  const canDecide = pengajuan.status_approval === 'Menunggu Direktur';

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackButton onClick={onBack} title="Kembali ke Beranda" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
            Approval Material / {pengajuan.no_request}
          </h1>
          <p className="text-xs text-gray-500">
            {pengajuan.proyek?.nama_proyek} • {pengajuan.proyek?.dinas_pemberi_kerja}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showOverRabWarning && pengajuan.total_estimasi !== null && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 shadow-sm"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <div className="font-bold text-rose-800">Peringatan Khusus: Melebihi Pagu RAB</div>
            <p className="mt-0.5">
              Total pengajuan (<strong className="text-rose-700">{formatRupiah(totalEstimasi)}</strong>)
              melebihi sisa pagu RAB proyek (
              <strong className="text-rose-700">{formatRupiah(sisaPagu)}</strong>). Harap tinjau
              ulang sebelum menyetujui penerbitan PO.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Rincian Volume (Lapangan) &amp; Harga/Vendor (Keuangan) — {items.length} item
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold text-sky-700">
              Status: {pengajuan.status_approval}
            </span>
            {pengajuan.skema_pembayaran && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-semibold text-indigo-700">
                Skema: {pengajuan.skema_pembayaran}
              </span>
            )}
            {pengajuan.sifat_pengajuan === 'Darurat' && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-semibold text-rose-600">
                Darurat
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <th className="py-2.5 px-4 pl-0">Material</th>
                <th className="py-2.5 px-4">Volume</th>
                <th className="py-2.5 px-4">Vendor</th>
                <th className="py-2.5 px-4">Harga Satuan</th>
                <th className="py-2.5 px-4 pr-0 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {items.map((item) => {
                const harga = item.estimasi_harga !== null ? Number(item.estimasi_harga) : null;
                const subtotal = harga !== null ? Number(item.volume) * harga : null;
                return (
                  <tr key={item.id_item} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 pl-0 font-medium text-gray-900">
                      {item.nama_material}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700">
                      {item.volume} {item.satuan}
                    </td>
                    <td className="py-3 px-4">
                      {item.ketersediaan_vendor ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                          {item.vendor_nama || 'Tersedia'}
                        </span>
                      ) : item.vendor_pengganti ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                          Pengganti: {item.vendor_pengganti}
                        </span>
                      ) : (
                        <span className="text-gray-400">Belum diisi</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {harga !== null ? formatRupiah(harga) : 'Menunggu Keuangan'}
                    </td>
                    <td className="py-3 px-4 pr-0 text-right font-mono font-semibold text-gray-900">
                      {subtotal !== null ? formatRupiah(subtotal) : '—'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50/70 font-semibold text-gray-900">
                <td colSpan={4} className="py-3.5 px-4 pl-4 text-xs font-semibold">
                  Total Harga Pengajuan ({items.length} item)
                </td>
                <td
                  className={`py-3.5 px-4 pr-4 text-right font-mono text-sm font-bold ${
                    showOverRabWarning ? 'text-rose-600' : 'text-gray-900'
                  }`}
                >
                  {pengajuan.total_estimasi !== null
                    ? formatRupiah(pengajuan.total_estimasi)
                    : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {pengajuan.transaksi_pembelian && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 shrink-0 text-emerald-600" />
              <div className="text-xs">
                <div className="font-bold text-emerald-900">
                  Purchase Order Diterbitkan: {pengajuan.transaksi_pembelian.no_po}
                </div>
                <div className="text-emerald-700">
                  Tanggal PO: {formatTanggal(pengajuan.transaksi_pembelian.tanggal_po)} • Status:{' '}
                  {pengajuan.transaksi_pembelian.status_po}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 border-t border-gray-100 pt-6 md:grid-cols-2">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="font-medium text-gray-400">Pengaju Lapangan</span>
              <span className="font-semibold text-gray-900">{pengajuan.pengaju?.nama || '—'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="font-medium text-gray-400">Tanggal Dibutuhkan</span>
              <span className="font-semibold text-gray-900">
                {formatTanggal(pengajuan.tanggal_butuh)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="font-medium text-gray-400">Validator Keuangan</span>
              <span className="font-semibold text-gray-900">{pengajuan.validator?.nama || '—'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="font-medium text-gray-400">Sisa Pagu RAB</span>
              <span
                className={`text-sm font-bold ${
                  showOverRabWarning ? 'text-rose-600' : 'text-[#1877F2]'
                }`}
              >
                {formatRupiah(sisaPagu)}
              </span>
            </div>

            {pengajuan.catatan_lapangan && (
              <div className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-gray-700">
                <span className="mb-0.5 block font-semibold text-gray-500">Catatan Lapangan:</span>
                {pengajuan.catatan_lapangan}
              </div>
            )}

            {pengajuan.catatan_keuangan && (
              <div className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-gray-700">
                <span className="mb-0.5 block font-semibold text-gray-500">Catatan Keuangan:</span>
                {pengajuan.catatan_keuangan}
              </div>
            )}

            {pengajuan.riwayat_revisi && pengajuan.riwayat_revisi.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-gray-700">
                  <Clock className="h-3.5 w-3.5 text-[#1877F2]" />
                  <span>Riwayat Alur &amp; Revisi</span>
                </div>
                <div className="space-y-1.5">
                  {pengajuan.riwayat_revisi.map((log) => (
                    <div key={log.id_revisi} className="border-l-2 border-blue-200 pl-2.5 text-[11px]">
                      <div className="font-semibold text-gray-800">
                        {log.aksi} •{' '}
                        <span className="text-gray-500">
                          {log.pengguna?.nama ?? log.peran} ({formatTanggal(log.created_at)})
                        </span>
                      </div>
                      {log.alasan && <div className="text-gray-600">{log.alasan}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {canDecide ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Catatan Keputusan / Alasan Penolakan Direktur
              </label>
              <textarea
                value={catatan}
                onChange={(e) => {
                  setCatatan(e.target.value);
                  setAlasanError(null);
                }}
                placeholder="Tuliskan alasan jika menolak/meminta revisi, atau instruksi untuk pengadaan..."
                rows={3}
                className={`w-full rounded-xl border p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none ${
                  alasanError
                    ? 'border-rose-400 bg-rose-50/40'
                    : 'border-gray-200 focus:border-[#1877F2]'
                }`}
              />
              <FieldError message={alasanError} />

              <div className="text-[10px] text-gray-400">
                Persetujuan akan mengubah status menjadi <strong>Selesai</strong>, memotong sisa
                pagu RAB, dan menerbitkan Purchase Order (PO).
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleDecision('Revisi')}
                  className="rounded-full bg-[#DC2626] px-6 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                >
                  Tolak / Minta Revisi
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleDecision('Disetujui')}
                  className="flex items-center gap-2 rounded-full bg-[#1877F2] px-7 py-2.5 text-xs font-medium text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Memproses…' : 'Setujui & Terbitkan PO'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 rounded-2xl border border-gray-100 bg-slate-50 p-5 text-xs text-gray-600">
              <div className="font-bold text-gray-800">Keputusan Sudah Selesai / Belum Siap</div>
              <p>
                Pengajuan saat ini berstatus <strong>{pengajuan.status_approval}</strong> sehingga
                tombol persetujuan Direktur tidak aktif.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
