import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  materialService,
  type RequestMaterial,
  type SkemaPembayaran,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import {
  BackButton,
  CurrencyInput,
  FieldError,
  SkeletonDashboard,
} from '../../components/ui';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface SekretarisValidasiPageProps {
  idRequest: number;
  onBack: () => void;
  onValidated: () => void;
}

interface ItemFinanceDraft {
  ketersediaan_vendor: boolean;
  vendor_nama: string;
  vendor_pengganti: string;
  harga_satuan: number;
}

export const SekretarisValidasiPage: React.FC<SekretarisValidasiPageProps> = ({
  idRequest,
  onBack,
  onValidated,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const {
    data: pengajuan,
    isLoading,
    error: queryError,
  } = useQuery<RequestMaterial>({
    queryKey: ['material-requests', 'detail', idRequest],
    queryFn: () => materialService.getDetail(idRequest),
  });

  const [itemDrafts, setItemDrafts] = useState<Record<number, ItemFinanceDraft>>({});
  const [skema, setSkema] = useState<SkemaPembayaran>('Kas');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const initializedReqIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!pengajuan || initializedReqIdRef.current === pengajuan.id_request) return;
    initializedReqIdRef.current = pengajuan.id_request;

    const nextDrafts: Record<number, ItemFinanceDraft> = {};
    for (const item of pengajuan.item_material ?? []) {
      nextDrafts[item.id_item] = {
        ketersediaan_vendor: item.ketersediaan_vendor ?? true,
        vendor_nama: item.vendor_nama ?? '',
        vendor_pengganti: item.vendor_pengganti ?? '',
        harga_satuan: item.estimasi_harga !== null ? Number(item.estimasi_harga) || 0 : 0,
      };
    }
    const timer = window.setTimeout(() => {
      setItemDrafts(nextDrafts);
      if (pengajuan.skema_pembayaran) {
        setSkema(pengajuan.skema_pembayaran);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pengajuan]);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (!pengajuan) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} label="Kembali ke Beranda" />
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
  const canReview = pengajuan.status_approval === 'Diajukan';

  const getDraft = (idItem: number): ItemFinanceDraft =>
    itemDrafts[idItem] ?? {
      ketersediaan_vendor: true,
      vendor_nama: '',
      vendor_pengganti: '',
      harga_satuan: 0,
    };

  const updateDraft = (idItem: number, patch: Partial<ItemFinanceDraft>) => {
    setItemDrafts((prev) => ({
      ...prev,
      [idItem]: { ...getDraft(idItem), ...patch },
    }));
  };

  const runningTotal = canReview
    ? items.reduce((sum, it) => sum + Number(it.volume) * getDraft(it.id_item).harga_satuan, 0)
    : Number(pengajuan.total_estimasi ?? 0);

  const isOverRab = runningTotal > sisaPagu;
  const isCompleted = pengajuan.status_approval === 'Selesai';
  const showOverRabWarning = !isCompleted && isOverRab;

  const handleSubmitDecision = async (keputusan: 'Setuju' | 'Revisi') => {
    const errs: Record<string, string | undefined> = {};

    if (keputusan === 'Revisi') {
      if (!catatan.trim()) {
        errs.catatan = 'Alasan penolakan / permintaan revisi wajib diisi.';
      }
    } else {
      for (const item of items) {
        const d = getDraft(item.id_item);
        if (d.ketersediaan_vendor && !d.vendor_nama.trim()) {
          errs[`vendor_${item.id_item}`] = 'Nama vendor wajib diisi.';
        }
        if (!d.ketersediaan_vendor && !d.vendor_pengganti.trim()) {
          errs[`vendor_${item.id_item}`] = 'Nama vendor pengganti wajib diisi.';
        }
        if (d.harga_satuan <= 0) {
          errs[`harga_${item.id_item}`] = 'Harga satuan harus lebih dari Rp 0.';
        }
      }
    }

    if (Object.values(errs).some(Boolean)) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setError(null);
    setSubmitting(true);

    try {
      await materialService.validateFinance(idRequest, {
        keputusan,
        skema_pembayaran: keputusan === 'Setuju' ? skema : undefined,
        catatan_keuangan: catatan.trim() || undefined,
        alasan_penolakan: keputusan === 'Revisi' ? catatan.trim() : undefined,
        items:
          keputusan === 'Setuju'
            ? items.map((item) => {
                const d = getDraft(item.id_item);
                return {
                  id_item: item.id_item,
                  ketersediaan_vendor: d.ketersediaan_vendor,
                  vendor_nama: d.ketersediaan_vendor ? d.vendor_nama.trim() : d.vendor_nama.trim() || undefined,
                  vendor_pengganti: !d.ketersediaan_vendor ? d.vendor_pengganti.trim() : undefined,
                  harga_satuan: d.harga_satuan,
                };
              })
            : undefined,
      });

      showToast({
        type: 'success',
        message:
          keputusan === 'Setuju'
            ? 'Harga & vendor disimpan. Pengajuan diteruskan ke Direktur.'
            : 'Pengajuan dikembalikan ke Admin Lapangan untuk revisi.',
      });
      await queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      await triggerSyncNow();
      onValidated();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal menyimpan hasil review Keuangan.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <BackButton onClick={onBack} title="Kembali ke Beranda" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
            Review Harga, Vendor &amp; RAB / {pengajuan.no_request}
          </h1>
          <p className="text-xs text-gray-500">
            {pengajuan.proyek?.nama_proyek} • Pengaju: {pengajuan.pengaju?.nama} • Dibutuhkan:{' '}
            <strong>{formatTanggal(pengajuan.tanggal_butuh)}</strong>
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pagu RAB vs Total Harga Terinput (padding tetap konstan, warna angka Total & Sisa RAB merah saat melebihi pagu & belum disetujui - 1.1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-xs shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          {showOverRabWarning ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span className={showOverRabWarning ? 'text-rose-700' : 'text-gray-800'}>
            {isCompleted
              ? 'Pengajuan telah disetujui Direktur dan PO telah diterbitkan.'
              : showOverRabWarning
                ? 'Melebihi Pagu RAB: Pengajuan tetap dapat diteruskan ke Direktur dengan tanda peringatan khusus.'
                : 'Pagu RAB Mencukupi: Total pengajuan berada dalam sisa pagu anggaran.'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono font-bold">
          <span>
            Total:{' '}
            <span className={showOverRabWarning ? 'text-rose-600' : 'text-gray-900'}>
              {formatRupiah(runningTotal)}
            </span>
          </span>
          <span className="text-gray-300">/</span>
          <span>
            Sisa RAB:{' '}
            <span className={showOverRabWarning ? 'text-rose-600' : 'text-emerald-700'}>
              {formatRupiah(sisaPagu)}
            </span>
          </span>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        {pengajuan.catatan_lapangan && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-gray-700">
            <span className="font-bold text-[#1877F2]">Catatan Admin Lapangan: </span>
            {pengajuan.catatan_lapangan}
          </div>
        )}

        {/* Daftar item: Volume Lapangan vs Input Vendor & Harga Keuangan */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Rincian Kebutuhan Material ({items.length} item)
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const draft = getDraft(item.id_item);
              const subtotal = Number(item.volume) * draft.harga_satuan;

              return (
                <div
                  key={item.id_item}
                  className="rounded-2xl border border-gray-200 bg-slate-50/70 p-4 text-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 pb-2.5">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{item.nama_material}</div>
                      <div className="text-[11px] text-gray-600">
                        Volume diajukan:{' '}
                        <strong className="text-[#1877F2]">
                          {item.volume} {item.satuan}
                        </strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-gray-400 font-semibold">
                        Subtotal
                      </div>
                      <div className="font-mono text-sm font-bold text-gray-900">
                        {formatRupiah(subtotal)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-start">
                    {/* Pilihan Vendor Tersedia / Tidak Tersedia (KEU-01 & KEU-02) */}
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="block text-[11px] font-semibold text-gray-600">
                        Status Vendor
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          disabled={!canReview}
                          onClick={() => {
                            updateDraft(item.id_item, { ketersediaan_vendor: true });
                            setFieldErrors((p) => ({ ...p, [`vendor_${item.id_item}`]: undefined }));
                          }}
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition ${
                            draft.ketersediaan_vendor
                              ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Vendor Tersedia
                        </button>
                        <button
                          type="button"
                          disabled={!canReview}
                          onClick={() => {
                            updateDraft(item.id_item, { ketersediaan_vendor: false });
                            setFieldErrors((p) => ({ ...p, [`vendor_${item.id_item}`]: undefined }));
                          }}
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition ${
                            !draft.ketersediaan_vendor
                              ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Tidak Tersedia
                        </button>
                      </div>
                    </div>

                    {/* Nama Vendor / Vendor Pengganti */}
                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                        {draft.ketersediaan_vendor
                          ? 'Nama Vendor'
                          : 'Nama Vendor Pengganti (Wajib)'}
                      </label>
                      {draft.ketersediaan_vendor ? (
                        <input
                          type="text"
                          disabled={!canReview}
                          value={draft.vendor_nama}
                          onChange={(e) => {
                            updateDraft(item.id_item, { vendor_nama: e.target.value });
                            setFieldErrors((p) => ({ ...p, [`vendor_${item.id_item}`]: undefined }));
                          }}
                          placeholder="Misal: PT Semen Nusantara"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-[#1877F2] focus:outline-none disabled:opacity-60"
                        />
                      ) : (
                        <input
                          type="text"
                          disabled={!canReview}
                          value={draft.vendor_pengganti}
                          onChange={(e) => {
                            updateDraft(item.id_item, { vendor_pengganti: e.target.value });
                            setFieldErrors((p) => ({ ...p, [`vendor_${item.id_item}`]: undefined }));
                          }}
                          placeholder="Isi nama supplier pengganti..."
                          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs focus:border-[#1877F2] focus:outline-none disabled:opacity-60"
                        />
                      )}
                      <FieldError message={fieldErrors[`vendor_${item.id_item}`]} />
                    </div>

                    {/* Harga Satuan (Rp) */}
                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                        Harga Satuan (Rp / {item.satuan})
                      </label>
                      <CurrencyInput
                        ariaLabel={`Harga satuan ${item.nama_material}`}
                        disabled={!canReview}
                        hasError={Boolean(fieldErrors[`harga_${item.id_item}`])}
                        value={draft.harga_satuan}
                        onChange={(val) => {
                          updateDraft(item.id_item, { harga_satuan: val });
                          setFieldErrors((p) => ({ ...p, [`harga_${item.id_item}`]: undefined }));
                        }}
                        className="bg-white"
                      />
                      <FieldError message={fieldErrors[`harga_${item.id_item}`]} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kontrol Skema & Keputusan */}
        <div className="grid grid-cols-1 items-start gap-8 border-t border-gray-100 pt-6 md:grid-cols-2">
          <div className="space-y-4 text-xs">
            <div>
              <div className="mb-2 font-semibold text-gray-700">Skema Pembayaran</div>
              <div className="grid grid-cols-2 gap-2.5">
                {(['Kas', 'Kredit'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={!canReview}
                    onClick={() => setSkema(opt)}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                      skema === opt
                        ? 'border-[#1877F2] bg-[#1877F2] text-white shadow-sm'
                        : 'border-gray-200 bg-slate-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {opt === 'Kas' ? 'Kas Operasional' : 'Fasilitas Kredit Bank'}
                  </button>
                ))}
              </div>
            </div>

            {pengajuan.riwayat_revisi && pengajuan.riwayat_revisi.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-gray-700">
                  <Clock className="h-3.5 w-3.5 text-[#1877F2]" />
                  <span>Riwayat Pengajuan &amp; Revisi</span>
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

          {canReview ? (
            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-gray-700">
                Catatan Keuangan / Alasan Penolakan (wajib jika menolak)
              </label>
              <textarea
                value={catatan}
                onChange={(e) => {
                  setCatatan(e.target.value);
                  setFieldErrors((p) => ({ ...p, catatan: undefined }));
                }}
                placeholder="Tuliskan catatan survei vendor/harga atau alasan meminta revisi ke Admin Lapangan..."
                rows={3}
                className={`w-full rounded-xl border p-3 focus:outline-none ${
                  fieldErrors.catatan
                    ? 'border-rose-400 bg-rose-50/40'
                    : 'border-gray-200 focus:border-[#1877F2]'
                }`}
              />
              <FieldError message={fieldErrors.catatan} />

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmitDecision('Revisi')}
                  className="rounded-full bg-[#DC2626] px-5 py-2.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Tolak / Minta Revisi
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmitDecision('Setuju')}
                  className="flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-2.5 text-xs font-medium text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Memproses…' : 'Setujui & Teruskan ke Direktur'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 rounded-2xl border border-gray-100 bg-slate-50 p-5 text-xs text-gray-600">
              <div className="font-bold text-gray-800">Sudah Diproses</div>
              <p>
                Pengajuan saat ini berstatus <strong>{pengajuan.status_approval}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
