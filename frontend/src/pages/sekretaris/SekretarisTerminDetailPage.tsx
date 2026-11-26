import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  billingService,
  earlyWarningService,
  projectService,
  terminService,
  type EarlyWarningAnalysis,
  type ProjectDetailResponse,
  type TerminChecklistResponse,
  type TerminListItem,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatRupiah, formatRupiahCompact, formatTanggal } from '../../lib/formatters';
import { DownloadPerformanceReportButton } from '../../components/common/DownloadPerformanceReportButton';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { ProjectMonitoringPanel } from '../../components/common/ProjectMonitoringPanel';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import {
  EarlyWarningStatusBadge,
  EarlyWarningStatusBanner,
} from '../../components/common/EarlyWarningVisuals';
import {
  BackButton,
  CustomCheckbox,
  FieldError,
  SkeletonDashboard,
  WheelDatePicker,
} from '../../components/ui';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Eye,
  FileCheck2,
  Phone,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SekretarisTerminDetailPageProps {
  proyekId: number;
  onBack: () => void;
  onOpenBankCoordination: () => void;
}

export const SekretarisTerminDetailPage: React.FC<SekretarisTerminDetailPageProps> = ({
  proyekId,
  onBack,
  onOpenBankCoordination,
}) => {
  const queryClient = useQueryClient();
  const { prompt, showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const [activeTab, setActiveTab] = useState<'peringatan' | 'monitoring' | 'berkas' | 'penagihan'>('peringatan');
  const [userSelectedTerminId, setUserSelectedTerminId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    idTermin: number;
    idDokumen: number;
    title: string;
    subtitle: string;
    fileNameHint: string;
  } | null>(null);

  // Billing forms
  const [nomorSuratSerah, setNomorSuratSerah] = useState('');
  const [tanggalPengajuan, setTanggalPengajuan] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [nomorSp2d, setNomorSp2d] = useState('');
  const [tanggalCair, setTanggalCair] = useState(() => new Date().toISOString().slice(0, 10));
  const [catatanKoreksi, setCatatanKoreksi] = useState('');
  const [koreksiDocIds, setKoreksiDocIds] = useState<Record<number, string>>({});
  const [billingErrs, setBillingErrs] = useState<Record<string, string | undefined>>({});

  const { data: detail, isLoading: loadingDetail } = useQuery<ProjectDetailResponse>({
    queryKey: ['projects', 'detail', proyekId],
    queryFn: () => projectService.getProjectDetail(proyekId),
  });

  const { data: terminList = [], isLoading: loadingTermin } = useQuery<TerminListItem[]>({
    queryKey: ['termin', 'list', proyekId],
    queryFn: () => terminService.listByProject(proyekId),
  });

  const { data: ew, isLoading: loadingEw } = useQuery<EarlyWarningAnalysis>({
    queryKey: ['early-warning', 'project', proyekId],
    queryFn: () => earlyWarningService.getProjectAnalysis(proyekId),
  });

  const defaultTerminId =
    ew?.termin_berjalan?.id_termin ??
    terminList.find((t) => t.status_penagihan !== 'SP2D cair')?.id_termin ??
    terminList[0]?.id_termin ??
    null;

  const selectedTerminId = userSelectedTerminId ?? defaultTerminId;

  const { data: checklist = null } = useQuery<TerminChecklistResponse>({
    queryKey: ['termin', 'checklist', selectedTerminId],
    queryFn: () => terminService.getChecklist(selectedTerminId!),
    enabled: Boolean(selectedTerminId),
  });

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['termin'] });
    await queryClient.invalidateQueries({ queryKey: ['early-warning'] });
    await triggerSyncNow();
  };

  const handleVerifikasiDokumen = async (
    idTermin: number,
    idDokumen: number,
    approve: boolean,
    labelDokumen: string
  ) => {
    let catatanRevisi: string | undefined;
    if (!approve) {
      const reason = await prompt({
        title: 'Tolak & Minta Revisi Berkas',
        message: `Tuliskan alasan penolakan / koreksi untuk "${labelDokumen}" agar segera diperbaiki Admin Lapangan:`,
        placeholder: 'Misal: Tanda tangan belum lengkap atau hasil scan buram',
        confirmLabel: 'Kembalikan ke Lapangan',
        required: true,
      });
      if (!reason) return;
      catatanRevisi = reason;
    }

    setVerifyingDocId(idDokumen);
    setUserSelectedTerminId(idTermin);
    setError(null);
    try {
      await terminService.verifikasiDokumen(idTermin, idDokumen, {
        status_verifikasi: approve,
        catatan_revisi: catatanRevisi,
      });
      showToast({
        type: 'success',
        message: approve
          ? `${labelDokumen} berhasil diverifikasi.`
          : `${labelDokumen} dikembalikan ke Lapangan untuk revisi.`,
      });
      await invalidateAll();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal memperbarui status verifikasi berkas termin.'));
    } finally {
      setVerifyingDocId(null);
    }
  };

  const handleDownloadDokumenTermin = async (
    idTermin: number,
    idDokumen: number,
    fileNameHint: string
  ) => {
    try {
      const { blob } = await terminService.fetchDokumenBlob(idTermin, idDokumen, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNameHint || `dokumen-termin-${idDokumen}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', message: 'Berkas dokumen termin berhasil diunduh.' });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: extractApiError(err, 'Gagal mengunduh berkas dokumen termin.'),
      });
    }
  };

  const handleAjukan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerminId) return;
    if (!nomorSuratSerah.trim()) {
      setBillingErrs({ nomorSuratSerah: 'Nomor surat penyerahan wajib diisi.' });
      return;
    }

    setBillingErrs({});
    setUserSelectedTerminId(selectedTerminId);
    setSubmitting(true);
    setError(null);
    try {
      await billingService.ajukan(selectedTerminId, {
        nomor_surat_serah: nomorSuratSerah.trim(),
        tanggal_pengajuan: tanggalPengajuan,
      });
      setNomorSuratSerah('');
      showToast({ type: 'success', message: 'Tagihan termin berhasil diajukan ke dinas.' });
      await invalidateAll();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal mengajukan tagihan termin ke dinas.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSp2d = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerminId) return;
    if (!nomorSp2d.trim()) {
      setBillingErrs({ nomorSp2d: 'Nomor SP2D wajib diisi.' });
      return;
    }

    setBillingErrs({});
    setUserSelectedTerminId(selectedTerminId);
    setSubmitting(true);
    setError(null);
    try {
      await billingService.sp2d(selectedTerminId, {
        nomor_sp2d: nomorSp2d.trim(),
        tanggal_cair: tanggalCair,
      });
      setNomorSp2d('');
      showToast({ type: 'success', message: 'Pencairan SP2D berhasil dicatat!' });
      await invalidateAll();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal mencatat pencairan SP2D.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKoreksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerminId) return;
    if (!catatanKoreksi.trim()) {
      setBillingErrs({ catatanKoreksi: 'Catatan koreksi dinas wajib diisi.' });
      return;
    }

    setBillingErrs({});
    setUserSelectedTerminId(selectedTerminId);
    setSubmitting(true);
    setError(null);
    try {
      const dokumenRevisi = Object.entries(koreksiDocIds)
        .filter(([, note]) => note.trim() !== '')
        .map(([idDok, note]) => ({
          id_dokumen: Number(idDok),
          catatan_revisi: note.trim(),
        }));

      await billingService.koreksi(selectedTerminId, {
        catatan_koreksi_dinas: catatanKoreksi.trim(),
        dokumen: dokumenRevisi.length > 0 ? dokumenRevisi : undefined,
      });
      setCatatanKoreksi('');
      setKoreksiDocIds({});
      showToast({ type: 'success', message: 'Catatan koreksi dinas berhasil disimpan.' });
      await invalidateAll();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal mencatat koreksi dinas.'));
    } finally {
      setSubmitting(false);
    }
  };

  if ((loadingDetail || loadingTermin || loadingEw) && !detail) {
    return <SkeletonDashboard />;
  }

  const selectedTermin = terminList.find((t) => t.id_termin === selectedTerminId) ?? terminList[0];

  const kurvaChartData = (() => {
    if (!ew) return [];
    const targetPoints =
      ew.kurva_s.target_proyek && ew.kurva_s.target_proyek.length > 0
        ? ew.kurva_s.target_proyek
        : ew.kurva_s.target;
    const map = new Map<string, { tanggal: string; target?: number; realisasi?: number }>();
    for (const pt of targetPoints) {
      if (!pt.tanggal) continue;
      map.set(pt.tanggal, { ...(map.get(pt.tanggal) ?? { tanggal: pt.tanggal }), target: pt.persentase });
    }
    for (const pt of ew.kurva_s.realisasi) {
      if (!pt.tanggal) continue;
      map.set(pt.tanggal, {
        ...(map.get(pt.tanggal) ?? { tanggal: pt.tanggal }),
        realisasi: pt.persentase,
      });
    }
    return Array.from(map.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  })();

  const getTerminBadgeClass = (status: TerminListItem['status_penagihan']) => {
    switch (status) {
      case 'SP2D cair':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Siap serah':
        return 'bg-amber-400 text-amber-950';
      case 'Diajukan ke Dinas':
        return 'bg-sky-100 text-sky-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} title="Kembali ke Daftar Proyek" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
              {detail?.proyek.kode_proyek} — {detail?.proyek.nama_proyek}
            </h1>
            <p className="text-xs text-gray-500">{detail?.proyek.dinas_pemberi_kerja}</p>
          </div>
        </div>
        {ew && <EarlyWarningStatusBadge status={ew.status} />}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Termin Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {terminList.map((t) => {
          const isSelected = selectedTermin?.id_termin === t.id_termin;
          return (
            <button
              key={t.id_termin}
              type="button"
              onClick={() => setUserSelectedTerminId(t.id_termin)}
              className={`flex h-[122px] flex-col justify-between rounded-2xl p-5 text-left transition ${
                isSelected
                  ? 'bg-[#1877F2] text-white shadow-md shadow-blue-500/20'
                  : 'border border-gray-100 bg-white text-gray-900 shadow-sm hover:border-blue-200'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}
                >
                  Termin {t.nomor_termin} ({t.target_persentase}%)
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getTerminBadgeClass(
                    t.status_penagihan
                  )}`}
                >
                  {t.status_penagihan}
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {formatRupiahCompact(t.nilai_tagihan)}
              </div>
              <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                Tenggat: {formatTanggal(t.tenggat_waktu)} • Berkas {t.checklist.terverifikasi}/
                {t.checklist.total}
              </div>
            </button>
          );
        })}
      </div>

      {/* Top Navbar Tabs dengan underline biru aktif (1.2 UI/UX) */}
      <div className="border-b border-gray-200">
        <div
          role="tablist"
          aria-label="Navigasi fitur pemantauan proyek"
          className="-mb-px flex items-center gap-6 overflow-x-auto px-1"
        >
          {(
            [
              { key: 'peringatan', label: 'Peringatan Dini' },
              { key: 'monitoring', label: 'Progres & Kendala' },
              { key: 'berkas', label: 'Berkas Checklist' },
              { key: 'penagihan', label: 'Penagihan & SP2D' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 whitespace-nowrap border-b-2 pb-3 pt-1 text-xs font-semibold transition ${
                  isActive
                    ? 'border-[#1877F2] text-[#1877F2]'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PERINGATAN DINI */}
      {activeTab === 'peringatan' && ew && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <DownloadPerformanceReportButton
              proyekId={proyekId}
              kodeProyek={detail?.proyek.kode_proyek}
              onError={(msg) => setError(msg)}
            />

            <button
              type="button"
              onClick={onOpenBankCoordination}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-100"
            >
              <Phone className="h-3.5 w-3.5 text-[#1877F2]" />
              <span>Koordinasi Kredit Bank</span>
            </button>
          </div>

          <EarlyWarningStatusBanner analysis={ew} />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Deviasi Progres Kurva S
              </div>
              <div
                className={`text-2xl font-bold ${
                  ew.status === 'Aman'
                    ? 'text-emerald-600'
                    : ew.status === 'Waspada'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                }`}
              >
                {ew.progres.deviasi_poin !== null
                  ? `${ew.progres.deviasi_poin > 0 ? '+' : ''}${ew.progres.deviasi_poin} poin`
                  : 'Tuntas'}
              </div>
              <div className="text-xs text-gray-500">
                Realisasi {ew.progres.realisasi_terakhir}% vs target ekspektasi{' '}
                {ew.progres.target_ekspektasi ?? 100}%
              </div>
            </div>

            <div className="space-y-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Estimasi Hari Telat
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {ew.prediksi.estimasi_hari_terlambat} hari
              </div>
              <div className="text-xs text-gray-500">
                {ew.termin_berjalan
                  ? `Tenggat Termin ${ew.termin_berjalan.nomor_termin}: ${formatTanggal(
                      ew.termin_berjalan.tenggat_waktu
                    )}`
                  : 'Semua termin telah diajukan/cair'}
              </div>
            </div>

            <div className="space-y-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Dampak Ke Kas
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatRupiah(ew.prediksi.estimasi_kerugian)}
              </div>
              <div className="text-xs text-gray-500">
                {ew.prediksi.estimasi_kerugian === 0
                  ? 'Tidak ada potensi denda/penundaan pencairan'
                  : 'Potensi keterlambatan pencairan termin'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-7">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-800">
                  Kurva target vs realisasi fisik
                </h3>
                <div className="text-xs text-gray-500">
                  Laju:{' '}
                  {ew.progres.laju_per_hari !== null ? `${ew.progres.laju_per_hari}%/hari` : '—'}
                </div>
              </div>

              {kurvaChartData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-xs text-gray-400">
                  Belum ada data laporan progres fisik untuk menampilkan Kurva S.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={kurvaChartData}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="tanggal"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        unit="%"
                        domain={[0, 100]}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="target"
                        name="Target (%)"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="realisasi"
                        name="Realisasi (%)"
                        stroke="#1877F2"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#1877F2' }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-5">
              <h3 className="border-b border-gray-100 pb-3 text-sm font-bold text-gray-800">
                Kendala Aktif &amp; Mitigasi
              </h3>

              {ew.kendala_aktif.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="font-bold">Tidak Ada Kendala Aktif</div>
                    <p className="mt-0.5 text-[11px]">
                      Seluruh aktivitas lapangan berjalan lancar tanpa hambatan tertunda.
                    </p>
                  </div>
                </div>
              ) : (
                ew.kendala_aktif.map((k) => (
                  <div
                    key={k.id_kendala}
                    className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        [{k.kategori_kendala} • {k.tingkat_keparahan}] — Tertunda{' '}
                        {k.estimasi_hari_tertunda} hari
                      </div>
                      <p className="text-[11px] text-gray-600">{k.deskripsi_kendala}</p>
                    </div>
                  </div>
                ))
              )}

              {ew.rekomendasi && (
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1877F2]" />
                  <div>
                    <div className="font-bold text-gray-900">Rekomendasi Sistem</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-gray-700">
                      {ew.rekomendasi.teks}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRES FISIK & KENDALA LAPANGAN (2.1 / A4) */}
      {activeTab === 'monitoring' && <ProjectMonitoringPanel proyekId={proyekId} />}

      {/* TAB 3: BERKAS CHECKLIST (Preview Inline + Verifikasi oleh Keuangan) */}
      {activeTab === 'berkas' && checklist && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-semibold uppercase text-gray-400">Dokumen Wajib</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {checklist.ringkasan.total} berkas
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-semibold uppercase text-gray-400">Terverifikasi</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">
                {checklist.ringkasan.terverifikasi} berkas ({checklist.ringkasan.persen}%)
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-semibold uppercase text-gray-400">Diunggah</div>
              <div className="mt-1 text-2xl font-bold text-[#1877F2]">
                {checklist.ringkasan.diunggah} dari {checklist.ringkasan.total} berkas
              </div>
            </div>
          </div>

          {checklist.peringatan && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <span>
                {checklist.peringatan.pesan} Estimasi kerugian keterlambatan:{' '}
                <strong>{formatRupiah(checklist.peringatan.estimasi_kerugian)}</strong>.
              </span>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase text-gray-400">
                    <th className="py-3 px-5">Dokumen Wajib</th>
                    <th className="py-3 px-4 text-center">Unggah</th>
                    <th className="py-3 px-4 text-center">Verifikasi</th>
                    <th className="py-3 px-4 text-center">Berkas</th>
                    <th className="py-3 px-5 text-right">Aksi Verifikasi Keuangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {checklist.dokumen_wajib.map((dok) => {
                    const isTerminLocked =
                      checklist.termin.status_penagihan === 'Diajukan ke Dinas' ||
                      checklist.termin.status_penagihan === 'SP2D cair';
                    const isBusy = verifyingDocId === dok.id_dokumen;
                    return (
                      <tr key={dok.jenis_dokumen}>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-gray-900">{dok.label}</div>
                          {dok.catatan_revisi && (
                            <div className="mt-0.5 text-[11px] text-rose-600">
                              Revisi: {dok.catatan_revisi}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              dok.diunggah
                                ? 'bg-blue-50 text-[#1877F2]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {dok.diunggah ? 'Sudah diunggah' : 'Belum diunggah'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              dok.status_verifikasi
                                ? 'bg-emerald-50 text-emerald-700'
                                : dok.catatan_revisi
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {dok.status_verifikasi
                              ? 'Terverifikasi'
                              : dok.catatan_revisi
                                ? 'Perlu Revisi'
                                : 'Menunggu'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {dok.diunggah && dok.id_dokumen ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  idTermin: checklist.termin.id_termin,
                                  idDokumen: dok.id_dokumen as number,
                                  title: dok.label,
                                  subtitle: `Termin ${checklist.termin.nomor_termin} (${checklist.termin.target_persentase}%)`,
                                  fileNameHint: dok.path_file ?? dok.jenis_dokumen,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-[#1877F2] hover:bg-blue-100"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Lihat Berkas</span>
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {dok.id_dokumen && !isTerminLocked ? (
                            <div className="inline-flex items-center gap-1.5">
                              {!dok.status_verifikasi && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    void handleVerifikasiDokumen(
                                      checklist.termin.id_termin,
                                      dok.id_dokumen as number,
                                      true,
                                      dok.label
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Verifikasi</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleVerifikasiDokumen(
                                    checklist.termin.id_termin,
                                    dok.id_dokumen as number,
                                    false,
                                    dok.label
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>{dok.status_verifikasi ? 'Cabut / Revisi' : 'Tolak'}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">
                              {isTerminLocked ? 'Terkunci' : 'Menunggu unggahan'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENAGIHAN & SP2D */}
      {activeTab === 'penagihan' && selectedTermin && (
        <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 text-xs shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Penagihan Termin {selectedTermin.nomor_termin} —{' '}
                {formatRupiah(selectedTermin.nilai_tagihan)}
              </h3>
              <p className="mt-0.5 text-gray-500">
                Status saat ini: <strong>{selectedTermin.status_penagihan}</strong>
              </p>
            </div>
          </div>

          {selectedTermin.catatan_koreksi_dinas && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="font-bold">Catatan Koreksi Dinas Sebelumnya:</div>
              <p className="mt-0.5">{selectedTermin.catatan_koreksi_dinas}</p>
            </div>
          )}

          {selectedTermin.status_penagihan === 'Belum siap' && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>
                Berkas persyaratan termin belum lengkap/terverifikasi semua (
                {selectedTermin.checklist.terverifikasi}/{selectedTermin.checklist.total}). Admin
                Lapangan harus mengunggah 4 berkas wajib dan tim Keuangan memverifikasinya pada tab
                Berkas Checklist sebelum penagihan ke dinas dapat diajukan.
              </span>
            </div>
          )}

          {selectedTermin.status_penagihan === 'Siap serah' && (
            <form onSubmit={handleAjukan} noValidate className="max-w-lg space-y-4">
              <h4 className="text-sm font-bold text-gray-800">
                Ajukan Penagihan Resmi ke Dinas
              </h4>
              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Nomor Surat Penyerahan Tagihan
                </label>
                <input
                  type="text"
                  value={nomorSuratSerah}
                  onChange={(e) => {
                    setNomorSuratSerah(e.target.value);
                    setBillingErrs({});
                  }}
                  placeholder="Misal: 027/DMP/XI/2026"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2.5 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
                <FieldError message={billingErrs.nomorSuratSerah} />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-gray-700">Tanggal Pengajuan</label>
                <WheelDatePicker
                  ariaLabel="Tanggal Pengajuan Tagihan"
                  value={tanggalPengajuan}
                  onChange={(val) => setTanggalPengajuan(val)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-2.5 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{submitting ? 'Memproses…' : 'Submit Penagihan ke Dinas'}</span>
              </button>
            </form>
          )}

          {selectedTermin.status_penagihan === 'Diajukan ke Dinas' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <form
                onSubmit={handleSp2d}
                noValidate
                className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5"
              >
                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span>Catat Pencairan SP2D</span>
                </h4>
                <p className="text-[11px] text-gray-600">
                  Surat Serah: <strong>{selectedTermin.nomor_surat_serah}</strong> (
                  {formatTanggal(selectedTermin.tanggal_pengajuan)})
                </p>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Nomor SP2D</label>
                  <input
                    type="text"
                    value={nomorSp2d}
                    onChange={(e) => {
                      setNomorSp2d(e.target.value);
                      setBillingErrs({});
                    }}
                    placeholder="SP2D-001/2026"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:border-[#1877F2] focus:outline-none"
                  />
                  <FieldError message={billingErrs.nomorSp2d} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Tanggal Cair</label>
                  <WheelDatePicker
                    ariaLabel="Tanggal Cair SP2D"
                    value={tanggalCair}
                    onChange={(val) => setTanggalCair(val)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Simpan Pencairan SP2D
                </button>
              </form>

              <form
                onSubmit={handleKoreksi}
                noValidate
                className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/30 p-5"
              >
                <h4 className="flex items-center gap-2 text-sm font-bold text-rose-900">
                  <RotateCcw className="h-4 w-4 text-rose-600" />
                  <span>Catat Pengembalian / Koreksi Dinas</span>
                </h4>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    Catatan Koreksi Administratif Dinas
                  </label>
                  <textarea
                    rows={2}
                    value={catatanKoreksi}
                    onChange={(e) => {
                      setCatatanKoreksi(e.target.value);
                      setBillingErrs({});
                    }}
                    placeholder="Jelaskan koreksi yang diminta dinas..."
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 focus:border-[#1877F2] focus:outline-none"
                  />
                  <FieldError message={billingErrs.catatanKoreksi} />
                </div>
                {checklist && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-gray-600">
                      Tandai dokumen yang perlu direvisi (opsional):
                    </div>
                    {checklist.dokumen_wajib
                      .filter((d) => d.id_dokumen !== null)
                      .map((d) => {
                        const docId = d.id_dokumen as number;
                        const checked = docId in koreksiDocIds;
                        return (
                          <div key={docId} className="space-y-1">
                            <CustomCheckbox
                              checked={checked}
                              onChange={(nextChecked) => {
                                if (nextChecked) {
                                  setKoreksiDocIds((prev) => ({
                                    ...prev,
                                    [docId]: 'Perlu perbaikan sesuai koreksi dinas',
                                  }));
                                } else {
                                  setKoreksiDocIds((prev) => {
                                    const copy = { ...prev };
                                    delete copy[docId];
                                    return copy;
                                  });
                                }
                              }}
                              label={d.label}
                            />
                            {checked && (
                              <input
                                type="text"
                                value={koreksiDocIds[docId]}
                                onChange={(e) =>
                                  setKoreksiDocIds((prev) => ({ ...prev, [docId]: e.target.value }))
                                }
                                placeholder="Catatan revisi dokumen..."
                                className="w-full rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px]"
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  Kembalikan ke Lapangan (Koreksi)
                </button>
              </form>
            </div>
          )}

          {selectedTermin.status_penagihan === 'SP2D cair' && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <div className="text-sm font-bold">
                  Termin Lunas / SP2D Cair ({selectedTermin.nomor_sp2d})
                </div>
                <p className="text-xs text-emerald-700">
                  Dicairkan pada {formatTanggal(selectedTermin.tanggal_cair)}.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {previewDoc && (
        <DocumentPreviewModal
          title={previewDoc.title}
          subtitle={previewDoc.subtitle}
          fileNameHint={previewDoc.fileNameHint}
          fetchBlob={() => terminService.fetchDokumenBlob(previewDoc.idTermin, previewDoc.idDokumen)}
          onDownload={() =>
            void handleDownloadDokumenTermin(
              previewDoc.idTermin,
              previewDoc.idDokumen,
              previewDoc.fileNameHint
            )
          }
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
