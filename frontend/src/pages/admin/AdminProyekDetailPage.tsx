import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  earlyWarningService,
  materialService,
  progressService,
  projectService,
  terminService,
  type EarlyWarningAnalysis,
  type MilestoneTercapai,
  type ProgresFisik,
  type ProjectDetailResponse,
  type RequestMaterial,
  type StatusApprovalMaterial,
  type TerminChecklistResponse,
  type TerminListItem,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatTanggal } from '../../lib/formatters';
import { EarlyWarningStatusBanner } from '../../components/common/EarlyWarningVisuals';
import { MaterialRequestModal } from '../../components/admin/MaterialRequestModal';
import { WeatherForecastWidget } from '../../components/admin/WeatherForecastWidget';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import {
  MultiPhotoPicker,
  PhotoThumbnailGrid,
} from '../../components/common/MultiPhotoPicker';
import { normalizeFotoPaths } from '../../lib/mediaHelpers';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import {
  BackButton,
  FieldError,
  NumberInput,
  SkeletonDashboard,
  WheelDatePicker,
} from '../../components/ui';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  Flag,
  Package,
  Plus,
  Printer,
} from 'lucide-react';

interface AdminProyekDetailPageProps {
  proyekId: number;
  onBack: () => void;
  onGoToKendala: () => void;
}

type FeatureView = 'overview' | 'progres' | 'material' | 'termin';

export const AdminProyekDetailPage: React.FC<AdminProyekDetailPageProps> = ({
  proyekId,
  onBack,
  onGoToKendala,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const [featureView, setFeatureView] = useState<FeatureView>('overview');
  const [userSelectedTerminId, setUserSelectedTerminId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<MilestoneTercapai[]>([]);

  // Form progres fisik (mendukung multi-foto - 2.1)
  const [tanggalLapor, setTanggalLapor] = useState(() => new Date().toISOString().slice(0, 10));
  const [capaian, setCapaian] = useState<number>(0);
  const [capaianInitialized, setCapaianInitialized] = useState(false);
  const [deskripsi, setDeskripsi] = useState('');
  const [fotosProgres, setFotosProgres] = useState<File[]>([]);
  const [submittingProgres, setSubmittingProgres] = useState(false);
  const [progresErrs, setProgresErrs] = useState<{ deskripsi?: string }>({});

  // Modal request material
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingRevisionReq, setEditingRevisionReq] = useState<RequestMaterial | null>(null);

  // Termin upload & inline preview state
  const [busyDocType, setBusyDocType] = useState<string | null>(null);
  const [previewTerminDoc, setPreviewTerminDoc] = useState<{
    idTermin: number;
    idDokumen: number;
    title: string;
    subtitle: string;
    fileNameHint: string;
  } | null>(null);

  const { data: detail, isLoading: loadingDetail } = useQuery<ProjectDetailResponse>({
    queryKey: ['projects', 'detail', proyekId],
    queryFn: () => projectService.getProjectDetail(proyekId),
  });

  const { data: terminList = [], isLoading: loadingTermin } = useQuery<TerminListItem[]>({
    queryKey: ['termin', 'list', proyekId],
    queryFn: () => terminService.listByProject(proyekId),
  });

  const { data: progressList = [], isLoading: loadingProg } = useQuery<ProgresFisik[]>({
    queryKey: ['progress', 'list', proyekId],
    queryFn: () => progressService.list(proyekId),
  });

  const { data: materialList = [], isLoading: loadingMat } = useQuery<RequestMaterial[]>({
    queryKey: ['material-requests', 'project', proyekId],
    queryFn: () => materialService.list({ id_proyek: proyekId }),
  });

  const { data: ew } = useQuery<EarlyWarningAnalysis>({
    queryKey: ['early-warning', 'project', proyekId],
    queryFn: () => earlyWarningService.getProjectAnalysis(proyekId),
  });

  useEffect(() => {
    if (capaianInitialized || loadingProg) return;
    const nextVal = progressList.length > 0 ? Number(progressList[0].persentase_realisasi) : 0;
    const t = window.setTimeout(() => {
      setCapaian(nextVal);
      setCapaianInitialized(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, [capaianInitialized, loadingProg, progressList]);

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

  const invalidateProjectData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['termin'] });
    await queryClient.invalidateQueries({ queryKey: ['progress'] });
    await queryClient.invalidateQueries({ queryKey: ['material-requests'] });
    await queryClient.invalidateQueries({ queryKey: ['early-warning'] });
    await triggerSyncNow();
  };

  const handleSimpanProgres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskripsi.trim()) {
      setProgresErrs({ deskripsi: 'Deskripsi realisasi pekerjaan wajib diisi.' });
      return;
    }

    setProgresErrs({});
    setSubmittingProgres(true);
    setError(null);
    try {
      const res = await progressService.create(proyekId, {
        tanggal_lapor: tanggalLapor,
        persentase_realisasi: capaian,
        deskripsi_pekerjaan: deskripsi.trim(),
        fotos: fotosProgres,
      });
      setMilestones(res.milestone_tercapai);
      setDeskripsi('');
      setFotosProgres([]);
      showToast({
        type: 'success',
        message: `Laporan progres (${res.progres.persentase_realisasi}%) tersimpan.`,
      });
      await invalidateProjectData();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal menyimpan laporan progres fisik.'));
    } finally {
      setSubmittingProgres(false);
    }
  };

  const handleToggleVerifikasiPengawas = async (item: ProgresFisik) => {
    setError(null);
    try {
      await progressService.verifikasiPengawas(item.id_progres, !item.verifikasi_pengawas);
      showToast({ type: 'success', message: 'Status verifikasi pengawas diperbarui.' });
      await invalidateProjectData();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal memperbarui status verifikasi pengawas.'));
    }
  };

  const handleUploadDokumenTermin = async (jenisDokumen: string, file: File | null) => {
    if (!file || !selectedTerminId) return;
    setBusyDocType(jenisDokumen);
    setError(null);
    try {
      await terminService.uploadDokumen(selectedTerminId, {
        jenis_dokumen: jenisDokumen,
        file_dokumen: file,
      });
      showToast({ type: 'success', message: 'Dokumen termin berhasil diunggah.' });
      await invalidateProjectData();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal mengunggah dokumen termin.'));
    } finally {
      setBusyDocType(null);
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
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal mengunduh dokumen termin.'));
    }
  };

  if ((loadingDetail || loadingTermin || loadingMat) && !detail) {
    return <SkeletonDashboard />;
  }

  const selectedTermin = terminList.find((t) => t.id_termin === selectedTerminId) ?? terminList[0];
  const isTerminLocked =
    selectedTermin?.status_penagihan === 'Diajukan ke Dinas' ||
    selectedTermin?.status_penagihan === 'SP2D cair';

  const getBadgeTermin = (status: TerminListItem['status_penagihan']) => {
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

  const getApprovalBadge = (status: StatusApprovalMaterial) => {
    switch (status) {
      case 'Diajukan':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Menunggu Direktur':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'Selesai':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Perlu Revisi':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
  };

  const revisiCount = materialList.filter((m) => m.status_approval === 'Perlu Revisi').length;

  return (
    <div className="space-y-5">
      {/* Header dengan BackButton (GLB-09) — kembali ke ringkasan proyek atau daftar proyek */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton
            onClick={() => {
              if (featureView !== 'overview') {
                setFeatureView('overview');
              } else {
                onBack();
              }
            }}
            title={
              featureView !== 'overview'
                ? 'Kembali ke Ringkasan Proyek'
                : 'Kembali ke Daftar Proyek'
            }
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              <span className="text-[#1877F2]">{detail?.proyek.kode_proyek}</span> —{' '}
              {detail?.proyek.nama_proyek}
            </h1>
            <p className="text-xs text-gray-500">
              {detail?.proyek.dinas_pemberi_kerja} • Realisasi Fisik:{' '}
              <strong>{detail?.rekap_progres.persentase_realisasi_terakhir ?? 0}%</strong>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {milestones.length > 0 && (
        <div className="space-y-1 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <div className="font-bold">Milestone Termin Tercapai!</div>
          {milestones.map((m) => (
            <div key={m.id_termin}>{m.pesan}</div>
          ))}
        </div>
      )}

      {/* VIEW: RINGKASAN PROYEK + 3 FEATURE CARDS (LAP-03) */}
      {featureView === 'overview' && (
        <div className="space-y-5">
          {/* Termin Cards (Tanpa menampilkan nilai rupiah/anggaran) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {terminList.map((t) => {
              const isSelected = selectedTermin?.id_termin === t.id_termin;
              return (
                <button
                  key={t.id_termin}
                  type="button"
                  onClick={() => setUserSelectedTerminId(t.id_termin)}
                  className={`flex flex-col gap-1.5 rounded-2xl p-4 text-left shadow-sm transition sm:p-5 ${
                    isSelected
                      ? 'bg-[#1877F2] text-white shadow-blue-400/30'
                      : 'border border-gray-100 bg-white text-gray-900 hover:border-blue-200'
                  }`}
                >
                  <div className="flex w-full flex-wrap items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}
                    >
                      Termin {t.nomor_termin} ({t.target_persentase}%)
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getBadgeTermin(
                        t.status_penagihan
                      )}`}
                    >
                      {t.status_penagihan}
                    </span>
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                    Berkas Terverifikasi:{' '}
                    <strong>
                      {t.checklist.terverifikasi}/{t.checklist.total}
                    </strong>
                  </div>
                  <div
                    className={`text-[10px] sm:text-xs ${
                      isSelected ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    Tenggat: {formatTanggal(t.tenggat_waktu)}
                  </div>
                </button>
              );
            })}
          </div>

          {ew && <EarlyWarningStatusBanner analysis={ew} />}

          {/* LAP-03: 3 Card Menu Fitur Operasional Proyek */}
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Menu Operasional Lapangan
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setFeatureView('progres')}
                className="group flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1877F2]">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700">
                    {progressList.length} Laporan
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Input Progres Fisik</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Laporkan capaian kumulatif, unggah foto dokumentasi, dan tandai pengawas.
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-[#1877F2]">
                  <span>Buka Fitur</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFeatureView('material')}
                className="group flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1877F2]">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {revisiCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {revisiCount} Revisi
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700">
                      {materialList.length} Ajuan
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Request Material</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Ajukan kebutuhan item dan volume material untuk diproses Keuangan.
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-[#1877F2]">
                  <span>Buka Fitur</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFeatureView('termin')}
                className="group flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1877F2]">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700">
                    {checklist ? `${checklist.ringkasan.terverifikasi}/${checklist.ringkasan.total} Berkas` : 'Checklist'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Ajuan Termin &amp; Checklist</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Unggah 4 berkas administrasi resmi penagihan Dinas untuk diverifikasi Keuangan.
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-[#1877F2]">
                  <span>Buka Fitur</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-HALAMAN 1: INPUT PROGRES FISIK */}
      {featureView === 'progres' && (
        <div className="space-y-5">
          <WeatherForecastWidget />
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Riwayat Progres Terbaru ({progressList.length})
            </div>

            {progressList.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-xs text-gray-400">
                Belum ada laporan progres fisik pada proyek ini.
              </div>
            ) : (
              <div className="space-y-3">
                {progressList.map((prog) => {
                  const fotoPaths = normalizeFotoPaths(prog);
                  return (
                    <div
                      key={prog.id_progres}
                      className="space-y-2.5 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-[#1877F2]">
                          {prog.persentase_realisasi}%
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatTanggal(prog.tanggal_lapor)}
                        </span>
                      </div>

                      <PhotoThumbnailGrid
                        paths={fotoPaths}
                        altPrefix={`Foto Progres ${prog.persentase_realisasi}%`}
                      />

                      <p className="font-medium leading-snug text-gray-800">
                        {prog.deskripsi_pekerjaan}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>{fotoPaths.length} foto terlampir</span>
                        <button
                          type="button"
                          onClick={() => void handleToggleVerifikasiPengawas(prog)}
                          className={`rounded-full px-2.5 py-0.5 font-semibold ${
                            prog.verifikasi_pengawas
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {prog.verifikasi_pengawas ? '✓ Pengawas' : 'Tandai Verif. Pengawas'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-8">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Form Lapor Progres Pekerjaan
              </h3>
            </div>

            <form onSubmit={handleSimpanProgres} noValidate className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-gray-600">Tanggal Lapor</label>
                  <WheelDatePicker
                    ariaLabel="Tanggal Lapor Progres"
                    value={tanggalLapor}
                    onChange={(val) => setTanggalLapor(val)}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-600">
                    Capaian kumulatif (%)
                  </label>
                  <div className="relative">
                    <NumberInput
                      ariaLabel="Capaian kumulatif persen"
                      allowDecimal
                      min={0}
                      max={100}
                      value={capaian}
                      onChange={(val) => setCapaian(val)}
                      className="pr-8 font-semibold"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-2.5 font-bold text-[#1877F2]">
                      %
                    </span>
                  </div>
                  {ew?.termin_berjalan && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#1877F2]">
                      <Flag className="h-3 w-3" />
                      <span>
                        Target Termin {ew.termin_berjalan.nomor_termin}:{' '}
                        {ew.termin_berjalan.target_persentase}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <MultiPhotoPicker
                files={fotosProgres}
                onChange={setFotosProgres}
                label="Foto bukti lapangan (opsional, dapat memilih beberapa foto)"
              />

              <div>
                <label className="mb-1 block font-medium text-gray-600">
                  Deskripsi pekerjaan
                </label>
                <textarea
                  rows={4}
                  value={deskripsi}
                  onChange={(e) => {
                    setDeskripsi(e.target.value);
                    setProgresErrs({});
                  }}
                  placeholder="Tuliskan rincian realisasi pekerjaan di lokasi proyek..."
                  className={`w-full resize-none rounded-xl border bg-slate-50 p-3.5 leading-relaxed focus:bg-white focus:outline-none ${
                    progresErrs.deskripsi
                      ? 'border-rose-400'
                      : 'border-gray-200 focus:border-[#1877F2]'
                  }`}
                />
                <FieldError message={progresErrs.deskripsi} />
              </div>

              <div className="flex flex-col items-start justify-between gap-3 border-t border-gray-100 pt-2 sm:flex-row sm:items-center">
                <div className="text-[11px] text-gray-400">
                  <span>Jika kendala menghambat, laporkan di menu </span>
                  <button
                    type="button"
                    onClick={onGoToKendala}
                    className="font-semibold text-[#1877F2] hover:underline"
                  >
                    Kendala Proyek
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submittingProgres}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 py-3 text-xs font-medium text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-60 sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{submittingProgres ? 'Menyimpan…' : 'Simpan laporan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}

      {/* SUB-HALAMAN 2: REQUEST MATERIAL (TANPA HARGA SAMA SEKALI) */}
      {featureView === 'material' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pengajuan Kebutuhan Material</h2>
              <p className="text-[11px] text-gray-500">
                Daftar ajuan item dan volume material lapangan (estimasi harga dikelola Keuangan)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingRevisionReq(null);
                setIsMaterialModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Unggah Ajuan Material</span>
            </button>
          </div>

          {materialList.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-xs text-gray-400">
              Belum ada pengajuan material pada proyek ini.
            </div>
          ) : (
            <div className="space-y-3">
              {materialList.map((req) => (
                <div
                  key={req.id_request}
                  className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 text-xs shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1877F2]">{req.no_request}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          req.sifat_pengajuan === 'Darurat'
                            ? 'border border-rose-200 bg-rose-50 text-rose-600'
                            : 'border border-blue-200 bg-blue-50 text-blue-600'
                        }`}
                      >
                        {req.sifat_pengajuan}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-semibold ${getApprovalBadge(
                        req.status_approval
                      )}`}
                    >
                      {req.status_approval}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    Diajukan: {formatTanggal(req.tanggal_pengajuan)} • Dibutuhkan:{' '}
                    <strong>{formatTanggal(req.tanggal_butuh)}</strong>
                  </div>

                  {/* Daftar item + volume + satuan (TANPA kolom harga) */}
                  <div className="flex flex-wrap gap-1.5">
                    {(req.item_material ?? []).map((it) => (
                      <span
                        key={it.id_item}
                        className="rounded-xl border border-gray-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-gray-800"
                      >
                        {it.nama_material} —{' '}
                        <strong className="text-[#1877F2]">
                          {it.volume} {it.satuan}
                        </strong>
                      </span>
                    ))}
                  </div>

                  {req.transaksi_pembelian && (
                    <div className="text-[11px] font-semibold text-emerald-700">
                      PO Terbit: {req.transaksi_pembelian.no_po} ({req.transaksi_pembelian.status_po})
                    </div>
                  )}

                  {req.status_approval === 'Perlu Revisi' && (
                    <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <div className="text-rose-800">
                        <strong>Alasan Penolakan / Revisi:</strong>{' '}
                        {req.alasan_penolakan ||
                          req.catatan_direktur ||
                          req.catatan_keuangan ||
                          'Harap perbaiki volume atau spesifikasi item material.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRevisionReq(req);
                          setIsMaterialModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-700"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Perbaiki &amp; Ajukan Ulang</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-HALAMAN 3: AJUAN TERMIN & CHECKLIST */}
      {featureView === 'termin' && checklist && (
        <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 text-xs shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Checklist Dokumen Termin {checklist.termin.nomor_termin} (
                {checklist.termin.target_persentase}%)
              </h3>
              <p className="text-[11px] text-gray-500">
                Status Penagihan: <strong>{checklist.termin.status_penagihan}</strong> • Berkas
                administrasi resmi penagihan Dinas (diverifikasi oleh Keuangan)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#1877F2]">
                {checklist.ringkasan.persen}% ({checklist.ringkasan.terverifikasi}/
                {checklist.ringkasan.total} terverifikasi)
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-100"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Lembar Kendali</span>
              </button>
            </div>
          </div>

          {terminList.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {terminList.map((t) => (
                <button
                  key={t.id_termin}
                  type="button"
                  onClick={() => setUserSelectedTerminId(t.id_termin)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                    selectedTermin?.id_termin === t.id_termin
                      ? 'bg-[#1877F2] text-white'
                      : 'border border-gray-200 bg-slate-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Termin {t.nomor_termin} ({t.target_persentase}%)
                </button>
              ))}
            </div>
          )}

          {checklist.termin.catatan_koreksi_dinas && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-800">
              <strong>Koreksi Dinas:</strong> {checklist.termin.catatan_koreksi_dinas}
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {checklist.dokumen_wajib.map((dok) => {
              const isBusy = busyDocType === dok.jenis_dokumen;
              return (
                <div
                  key={dok.jenis_dokumen}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        dok.status_verifikasi
                          ? 'bg-emerald-600 text-white'
                          : dok.catatan_revisi
                            ? 'bg-rose-100 text-rose-600'
                            : dok.diunggah
                              ? 'bg-sky-100 text-[#1877F2]'
                              : 'border-2 border-gray-300 text-gray-400'
                      }`}
                    >
                      {dok.status_verifikasi ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#1877F2]" />
                        <span className="font-semibold text-gray-900">{dok.label}</span>
                      </div>
                      {dok.catatan_revisi && (
                        <div className="text-[11px] font-medium text-rose-600">
                          Catatan Revisi Keuangan/Dinas: {dok.catatan_revisi}
                        </div>
                      )}
                      {dok.diunggah && dok.id_dokumen && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewTerminDoc({
                              idTermin: checklist.termin.id_termin,
                              idDokumen: dok.id_dokumen as number,
                              title: dok.label,
                              subtitle: `Termin ${checklist.termin.nomor_termin} (${checklist.termin.target_persentase}%)`,
                              fileNameHint: dok.path_file ?? dok.jenis_dokumen,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1877F2] hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Lihat berkas terunggah</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-9 sm:pl-0">
                    {!isTerminLocked && (
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 font-medium text-gray-700 hover:bg-gray-100">
                        <span>{isBusy ? 'Mengunggah…' : dok.diunggah ? 'Ganti berkas' : 'Unggah berkas'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            void handleUploadDokumenTermin(dok.jenis_dokumen, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                        dok.status_verifikasi
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : dok.catatan_revisi
                            ? 'border border-rose-200 bg-rose-50 text-rose-700'
                            : dok.diunggah
                              ? 'border border-sky-200 bg-sky-50 text-sky-700'
                              : 'border border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {dok.status_verifikasi
                        ? 'Terverifikasi Keuangan'
                        : dok.catatan_revisi
                          ? 'Perlu Revisi'
                          : dok.diunggah
                            ? 'Menunggu Verifikasi Keuangan'
                            : 'Belum Diunggah'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {checklist.peringatan ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <span>{checklist.peringatan.pesan}</span>
            </div>
          ) : checklist.ringkasan.lengkap ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>
                Seluruh 4 berkas termin lengkap &amp; terverifikasi! Status termin siap ditagihkan
                oleh tim Keuangan.
              </span>
            </div>
          ) : null}
        </div>
      )}

      {isMaterialModalOpen && (
        <MaterialRequestModal
          idProyek={proyekId}
          initialRequest={editingRevisionReq}
          onClose={() => {
            setIsMaterialModalOpen(false);
            setEditingRevisionReq(null);
          }}
          onSubmitted={() => {
            setIsMaterialModalOpen(false);
            setEditingRevisionReq(null);
            showToast({ type: 'success', message: 'Pengajuan kebutuhan material berhasil dikirim.' });
            void invalidateProjectData();
          }}
        />
      )}
      {previewTerminDoc && (
        <DocumentPreviewModal
          title={previewTerminDoc.title}
          subtitle={previewTerminDoc.subtitle}
          fileNameHint={previewTerminDoc.fileNameHint}
          fetchBlob={() =>
            terminService.fetchDokumenBlob(previewTerminDoc.idTermin, previewTerminDoc.idDokumen)
          }
          onDownload={() =>
            void handleDownloadDokumenTermin(
              previewTerminDoc.idTermin,
              previewTerminDoc.idDokumen,
              previewTerminDoc.fileNameHint
            )
          }
          onClose={() => setPreviewTerminDoc(null)}
        />
      )}
    </div>
  );
};
