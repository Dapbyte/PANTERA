import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveService,
  projectService,
  type ArchiveDetailResponseData,
  type ArchivePaginatedResponse,
  type ArsipDokumen,
  type CreateArchiveResponseData,
  type ProjectListItem,
  type StorageType,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatTanggal } from '../../lib/formatters';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { formatFileSize } from '../../lib/mediaHelpers';
import {
  CustomSelect,
  FieldError,
  SkeletonCards,
  SkeletonTable,
  WheelDatePicker,
} from '../ui';
import {
  Search,
  Trash2,
  Plus,
  X,
  FolderArchive,
  Folder,
  FolderOpen,
  FileText,
  Printer,
  Edit3,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  ExternalLink,
  LayoutGrid,
  List,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface ArchiveWorkspaceProps {
  allowCreate?: boolean;
  allowDelete?: boolean;
  allowEditLocation?: boolean;
}

const JENIS_ARSIP_OPTIONS = ['Berita Acara', 'Kwitansi', 'Kontrak', 'Faktur', 'Surat'];

interface UploadedArchiveFileCardProps {
  file: File;
  onPreview: () => void;
  onPickFile: (f: File | null) => void;
  onRemove: () => void;
}

const UploadedArchiveFileCard: React.FC<UploadedArchiveFileCardProps> = ({
  file,
  onPreview,
  onPickFile,
  onRemove,
}) => {
  const isImage =
    file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
  const extMatch = /\.([A-Za-z0-9]+)$/.exec(file.name);
  const extLabel = extMatch ? extMatch[1].toUpperCase() : 'FILE';
  const [thumbState, setThumbState] = useState<{ file: File; url: string } | null>(null);

  // Buat dan cabut Object URL di dalam useEffect agar tetap valid pada React StrictMode
  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    const url = URL.createObjectURL(file);
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setThumbState({ file, url });
      }
    });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  const thumbUrl = isImage && thumbState?.file === file ? thumbState.url : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={file.name}
            className="h-14 w-14 shrink-0 rounded-xl border border-blue-200 bg-white object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-blue-200 bg-white text-[#1877F2]">
            <FileText className="h-5 w-5" />
            <span className="mt-0.5 text-[9px] font-bold">{extLabel}</span>
          </div>
        )}

        <div className="min-w-0 space-y-0.5">
          <div className="truncate text-xs font-bold text-gray-900">{file.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
            <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-[#1877F2] border border-blue-100">
              {extLabel}
            </span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1877F2] hover:bg-blue-50"
        >
          <Eye className="h-3 w-3" />
          <span>Pratinjau</span>
        </button>

        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-100">
          <span>Ganti</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              onPickFile(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100"
        >
          <Trash2 className="h-3 w-3" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
};

export const ArchiveWorkspace: React.FC<ArchiveWorkspaceProps> = ({
  allowCreate = true,
  allowDelete = false,
  allowEditLocation = true,
}) => {
  const queryClient = useQueryClient();
  const { confirm, showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  // Filter, folder view, sort & pagination state (ARS-03..06, 3.1 Arsip Folder & Filter Proyek)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [viewMode, setViewMode] = useState<'folder' | 'list'>('folder');
  const [jenisArsip, setJenisArsip] = useState('');
  const [tipePenyimpanan, setTipePenyimpanan] = useState('');
  const [lokasiFisik, setLokasiFisik] = useState('');
  const [debouncedLokasi, setDebouncedLokasi] = useState('');
  const [sortOrder, setSortOrder] = useState<'terbaru' | 'terlama'>('terbaru');
  const [perPage, setPerPage] = useState<'10' | '25' | '50' | 'all'>('10');
  const [page, setPage] = useState(1);
  const [localPreviewOpen, setLocalPreviewOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedLokasi(lokasiFisik.trim());
    }, 250);
    return () => window.clearTimeout(t);
  }, [lokasiFisik]);

  const {
    data: archiveData,
    isLoading,
    error: queryError,
  } = useQuery<ArchivePaginatedResponse>({
    queryKey: [
      'archives',
      {
        id_proyek: filterProjectId,
        q: debouncedSearch,
        jenis_arsip: jenisArsip,
        tipe_penyimpanan: tipePenyimpanan,
        lokasi_fisik: debouncedLokasi,
        sort: sortOrder,
        per_page: perPage,
        page,
      },
    ],
    queryFn: () =>
      archiveService.searchArchives({
        id_proyek: filterProjectId ? Number(filterProjectId) : undefined,
        q: debouncedSearch || undefined,
        jenis_arsip: jenisArsip || undefined,
        tipe_penyimpanan: tipePenyimpanan || undefined,
        lokasi_fisik: debouncedLokasi || undefined,
        sort: sortOrder,
        per_page: perPage === 'all' ? 'all' : Number(perPage),
        page,
      }),
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'for-archive'],
    queryFn: () => projectService.getProjects(),
  });

  const archives = archiveData?.items ?? [];
  const meta = archiveData?.meta ?? { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  // Detail + inline preview + edit lokasi + cetak label (ARS-12, ARS-13, ARS-14)
  const [selectedDetail, setSelectedDetail] = useState<ArchiveDetailResponseData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [previewContentType, setPreviewContentType] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [editLocationMode, setEditLocationMode] = useState(false);
  const [editRuang, setEditRuang] = useState('');
  const [editRak, setEditRak] = useState('');
  const [editBinder, setEditBinder] = useState('');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editLocError, setEditLocError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [stickerModalData, setStickerModalData] = useState<{
    label_stiker: string;
    koordinat_label: string;
    judul_dokumen: string;
    nomor_surat: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  // Create form modal state (ARS-07..ARS-11, GLB-12)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<CreateArchiveResponseData | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formJudul, setFormJudul] = useState('');
  const [formNomorSurat, setFormNomorSurat] = useState('');
  const [formJenisArsip, setFormJenisArsip] = useState('Berita Acara');
  const [formJenisTransaksi, setFormJenisTransaksi] = useState('Administrasi Proyek');
  const [formPihakPenyedia, setFormPihakPenyedia] = useState('');
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTipe, setFormTipe] = useState<StorageType>('Hibrida');
  const [formRuang, setFormRuang] = useState('');
  const [formRak, setFormRak] = useState('');
  const [formBinder, setFormBinder] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);

  const effectiveProjectId = formProjectId || (projects[0] ? String(projects[0].id_proyek) : '');

  const closeDetailModal = () => {
    setSelectedDetail(null);
    setEditLocationMode(false);
    setPreviewError(null);
    setPreviewContentType('');
    setPreviewZoom(100);
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
  };

  useEffect(() => {
    if (!selectedDetail && !loadingDetail) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDetail(null);
        setEditLocationMode(false);
        setPreviewError(null);
        setPreviewContentType('');
        setPreviewZoom(100);
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [selectedDetail, loadingDetail]);

  const handleOpenDetail = async (item: ArsipDokumen) => {
    setLoadingDetail(true);
    setEditLocationMode(false);
    setEditLocError(null);
    setPreviewError(null);
    setPreviewZoom(100);
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }

    try {
      const detail = await archiveService.getArchiveDetail(item.id_arsip);
      setSelectedDetail(detail);
      setEditRuang(detail.lokasi_arsip_fisik?.ruang_simpan || '');
      setEditRak(detail.lokasi_arsip_fisik?.nomor_rak || '');
      setEditBinder(detail.lokasi_arsip_fisik?.nomor_binder || '');
      setEditKeterangan(detail.lokasi_arsip_fisik?.keterangan_posisi || '');
      setLoadingDetail(false);

      if (detail.path_digital) {
        setPreviewLoading(true);
        try {
          const { blob, contentType } = await archiveService.fetchArchiveFileBlob(item.id_arsip);
          const url = URL.createObjectURL(blob);
          setPreviewObjectUrl(url);
          setPreviewContentType(contentType);
        } catch (err: unknown) {
          setPreviewError(extractApiError(err, 'Gagal memuat preview dokumen digital.'));
        } finally {
          setPreviewLoading(false);
        }
      }
    } catch (err: unknown) {
      setLoadingDetail(false);
      showToast({
        type: 'error',
        message: extractApiError(err, 'Gagal membuka detail arsip.'),
      });
    }
  };

  const handleDownloadArchive = async (detail: ArchiveDetailResponseData) => {
    try {
      const { blob } = await archiveService.fetchArchiveFileBlob(detail.id_arsip, true);
      const url = URL.createObjectURL(blob);
      const extMatch = detail.path_digital ? /\.([A-Za-z0-9]+)$/.exec(detail.path_digital) : null;
      const ext = extMatch ? `.${extMatch[1]}` : '';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detail.kode_arsip}${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', message: `Berkas ${detail.kode_arsip} berhasil diunduh.` });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: extractApiError(err, 'Gagal mengunduh berkas arsip.'),
      });
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetail) return;
    if (!editRuang.trim() || !editRak.trim() || !editBinder.trim()) {
      setEditLocError('Ruang simpan, nomor rak, dan nomor binder wajib diisi.');
      return;
    }

    setEditLocError(null);
    setSavingEdit(true);
    try {
      const updated = await archiveService.updateArchive(selectedDetail.id_arsip, {
        ruang_simpan: editRuang.trim(),
        nomor_rak: editRak.trim(),
        nomor_binder: editBinder.trim(),
        keterangan_posisi: editKeterangan.trim() || null,
      });
      setSelectedDetail({
        ...selectedDetail,
        lokasi_arsip_fisik: updated.arsip.lokasi_arsip_fisik,
      });
      setEditLocationMode(false);
      showToast({ type: 'success', message: 'Koordinat lokasi fisik arsip berhasil diperbarui.' });
      await queryClient.invalidateQueries({ queryKey: ['archives'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setEditLocError(extractApiError(err, 'Gagal memperbarui lokasi fisik arsip.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (item: ArsipDokumen) => {
    const ok = await confirm({
      title: 'Hapus Arsip Dokumen',
      message: `Yakin ingin menghapus arsip ${item.kode_arsip} (${item.judul_dokumen})? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await archiveService.deleteArchive(item.id_arsip);
      showToast({ type: 'success', message: `Arsip ${item.kode_arsip} berhasil dihapus.` });
      await queryClient.invalidateQueries({ queryKey: ['archives'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      showToast({ type: 'error', message: extractApiError(err, 'Gagal menghapus arsip.') });
    }
  };

  const handlePickedFile = (file: File | null) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const extOk = /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extOk) {
      setFieldErrors((prev) => ({
        ...prev,
        file: 'Format file harus PDF, JPG, JPEG, atau PNG.',
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        file: 'Ukuran file maksimal 10 MB.',
      }));
      return;
    }
    setFormFile(file);
    setFieldErrors((prev) => ({ ...prev, file: undefined }));
  };

  const handleCreateArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string | undefined> = {};

    if (!effectiveProjectId) errs.project = 'Proyek wajib dipilih.';
    if (!formJudul.trim()) errs.judul = 'Judul dokumen wajib diisi.';
    if (!formNomorSurat.trim()) errs.nomorSurat = 'Nomor surat wajib diisi.';
    if (!formJenisTransaksi.trim()) errs.jenisTransaksi = 'Jenis transaksi wajib diisi.';
    if (!formPihakPenyedia.trim()) errs.pihakPenyedia = 'Pihak/penyedia wajib diisi.';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(formTanggal)) {
      errs.tanggal = 'Pilih tanggal yang valid menggunakan pemilih tanggal.';
    } else {
      const year = Number(formTanggal.slice(0, 4));
      if (year < 1990 || year > 2100) {
        errs.tanggal = 'Tahun tanggal arsip harus di antara 1990 hingga 2100.';
      }
    }

    if (formTipe !== 'Digital') {
      if (!formRuang.trim()) errs.ruang = 'Ruang simpan wajib diisi.';
      if (!formRak.trim()) errs.rak = 'Nomor rak wajib diisi.';
      if (!formBinder.trim()) errs.binder = 'Nomor binder wajib diisi.';
    }

    // ARS-10: Digital Murni dan Hibrida wajib mengunggah file
    if (formTipe !== 'Fisik' && !formFile) {
      errs.file = `Berkas digital wajib diunggah untuk tipe ${
        formTipe === 'Digital' ? 'Digital Murni' : 'Hibrida'
      }.`;
    }

    if (Object.values(errs).some(Boolean)) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setCreating(true);
    setCreateError(null);
    try {
      const res = await archiveService.createArchive({
        id_proyek: Number(effectiveProjectId),
        judul_dokumen: formJudul.trim(),
        nomor_surat: formNomorSurat.trim(),
        jenis_arsip: formJenisArsip,
        jenis_transaksi: formJenisTransaksi.trim(),
        pihak_penyedia: formPihakPenyedia.trim(),
        tanggal_arsip: formTanggal,
        tipe_penyimpanan: formTipe,
        ruang_simpan: formTipe === 'Digital' ? undefined : formRuang.trim(),
        nomor_rak: formTipe === 'Digital' ? undefined : formRak.trim(),
        nomor_binder: formTipe === 'Digital' ? undefined : formBinder.trim(),
        keterangan_posisi: formTipe === 'Digital' ? undefined : formKeterangan.trim() || undefined,
        file_dokumen: formTipe === 'Fisik' ? null : formFile,
      });
      setCreatedResult(res);
      setIsCreateOpen(false);
      setFormJudul('');
      setFormNomorSurat('');
      setFormPihakPenyedia('');
      setFormRuang('');
      setFormRak('');
      setFormBinder('');
      setFormKeterangan('');
      setFormFile(null);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ['archives'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setCreateError(extractApiError(err, 'Gagal menyimpan arsip baru.'));
    } finally {
      setCreating(false);
    }
  };

  const getLokasiLabel = (item: ArsipDokumen) => {
    const loc = item.lokasi_arsip_fisik;
    if (!loc) return item.tipe_penyimpanan === 'Digital' ? 'Digital Only' : '—';
    const rakTrim = loc.nomor_rak.trim();
    const binderTrim = loc.nomor_binder.trim();
    const rakLabel = /^rak\b/i.test(rakTrim) ? rakTrim : `Rak ${rakTrim}`;
    const binderLabel = /^binder\b/i.test(binderTrim) ? binderTrim : `Binder ${binderTrim}`;
    return `${loc.ruang_simpan} • ${rakLabel} • ${binderLabel}`;
  };

  const getTipeBadge = (tipe: StorageType) => {
    switch (tipe) {
      case 'Hibrida':
        return 'bg-blue-50 text-[#1877F2] border border-blue-200';
      case 'Fisik':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Digital':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  const digitalCount = archives.filter((a) => Boolean(a.path_digital)).length;
  const serverError = queryError ? extractApiError(queryError, 'Gagal memuat daftar arsip.') : null;
  const activeProject = projects.find((p) => String(p.id_proyek) === filterProjectId) ?? null;
  const hasSearchOrAttrFilter = Boolean(
    filterProjectId || debouncedSearch || jenisArsip || tipePenyimpanan || debouncedLokasi
  );
  const showFolderGrid = viewMode === 'folder' && !hasSearchOrAttrFilter;
  const isPdfPreview =
    previewContentType.includes('pdf') ||
    (selectedDetail?.path_digital?.toLowerCase().endsWith('.pdf') ?? false);
  const isImagePreview =
    previewContentType.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(selectedDetail?.path_digital ?? '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
            Arsip Proyek &amp; Dokumen
          </h1>
          <p className="text-xs text-gray-500">
            Pencarian terpusat arsip fisik, digital, dan koordinat rak penyimpanan
          </p>
        </div>

        {allowCreate && (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setFieldErrors({});
              if (filterProjectId) {
                setFormProjectId(filterProjectId);
              }
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1877F2] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Arsip Baru</span>
          </button>
        )}
      </div>

      {/* Ringkasan Portofolio Arsip gaya Pemantauan Proyek (ARS-01) */}
      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Ringkasan Repositori
        </div>
        {isLoading && !archiveData ? (
          <SkeletonCards count={2} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-3xl">
            <div className="flex h-[118px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Total Arsip Cocok Filter
              </div>
              <div className="text-3xl font-bold tracking-tight text-gray-900">
                {meta.total} Dokumen
              </div>
              <div className="text-xs text-gray-400">
                Halaman {meta.current_page} dari {meta.last_page}
              </div>
            </div>

            <div className="flex h-[118px] flex-col justify-between rounded-2xl bg-[#1877F2] p-5 text-white shadow-md shadow-blue-500/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/80">
                  Salinan Digital Pada Halaman Ini
                </span>
                <FolderArchive className="h-4 w-4 text-white/80" />
              </div>
              <div className="text-3xl font-bold tracking-tight">{digitalCount} Berkas</div>
              <div className="text-xs text-white/80">
                Siap pratinjau langsung &amp; unduh cepat
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar + Filter Proyek + Switcher Folder/List (3.1 Arsip) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 text-xs">
          {/* Breadcrumb navigasi folder gaya Google Drive */}
          <nav aria-label="Breadcrumb Arsip" className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setFilterProjectId('');
                setViewMode('folder');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                !activeProject && viewMode === 'folder'
                  ? 'bg-blue-50 text-[#1877F2]'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Folder className="h-3.5 w-3.5 text-[#1877F2]" />
              <span>Repositori Arsip</span>
            </button>
            {activeProject && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-[#1877F2]">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>
                    {activeProject.kode_proyek} — {activeProject.nama_proyek}
                  </span>
                </span>
              </>
            )}
          </nav>

          {/* Switch Tampilan Folder vs Semua Dokumen */}
          <div className="inline-flex items-center rounded-xl border border-gray-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => {
                setFilterProjectId('');
                setViewMode('folder');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                viewMode === 'folder' && !filterProjectId
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Folder Proyek</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                viewMode === 'list' || Boolean(filterProjectId)
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Daftar Dokumen</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kode arsip, judul, no. surat..."
              className="w-full rounded-full border border-gray-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:border-[#1877F2] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="lg:col-span-4">
            <CustomSelect
              ariaLabel="Filter proyek arsip"
              searchable
              value={filterProjectId}
              onChange={(val) => {
                setFilterProjectId(val);
                if (val) setViewMode('list');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Proyek' },
                ...projects.map((p) => ({
                  value: String(p.id_proyek),
                  label: `${p.kode_proyek} — ${p.nama_proyek}`,
                })),
              ]}
            />
          </div>

          <div className="lg:col-span-2">
            <CustomSelect
              ariaLabel="Filter jenis arsip"
              value={jenisArsip}
              onChange={(val) => {
                setJenisArsip(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Jenis' },
                ...JENIS_ARSIP_OPTIONS.map((opt) => ({ value: opt, label: opt })),
              ]}
            />
          </div>

          <div className="lg:col-span-2">
            <CustomSelect
              ariaLabel="Filter tipe penyimpanan"
              value={tipePenyimpanan}
              onChange={(val) => {
                setTipePenyimpanan(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Tipe' },
                { value: 'Hibrida', label: 'Hibrida' },
                { value: 'Fisik', label: 'Fisik' },
                { value: 'Digital', label: 'Digital' },
              ]}
            />
          </div>

          <div className="relative lg:col-span-9">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              aria-label="Filter lokasi fisik ruang rak atau binder"
              value={lokasiFisik}
              onChange={(e) => {
                setLokasiFisik(e.target.value);
                setPage(1);
              }}
              placeholder="Ruang / Rak / Binder..."
              className="w-full rounded-xl border border-gray-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:border-[#1877F2] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3">
            <CustomSelect
              ariaLabel="Urutkan tanggal arsip"
              value={sortOrder}
              onChange={(val) => {
                setSortOrder(val as 'terbaru' | 'terlama');
                setPage(1);
              }}
              options={[
                { value: 'terbaru', label: 'Terbaru' },
                { value: 'terlama', label: 'Terlama' },
              ]}
            />
          </div>
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Tampilan Grid Folder Proyek bergaya Google Drive (3.1) */}
      {showFolderGrid ? (
        loadingProjects ? (
          <SkeletonCards count={3} />
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center space-y-2 shadow-sm">
            <FolderArchive className="mx-auto h-8 w-8 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">Belum ada folder proyek tersedia</p>
            <p className="text-xs text-gray-400">
              Folder proyek akan muncul secara otomatis setelah proyek terdaftar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => (
              <button
                key={proj.id_proyek}
                type="button"
                onClick={() => {
                  setFilterProjectId(String(proj.id_proyek));
                  setViewMode('list');
                  setPage(1);
                }}
                className="group text-left transition hover:-translate-y-0.5"
              >
                {/* Tab Folder atas gaya explorer */}
                <div className="ml-0.5 inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-blue-200 bg-blue-50 px-3.5 py-1 text-[10px] font-bold tracking-wider text-[#1877F2]">
                  <Folder className="h-3 w-3 fill-[#1877F2]/20 text-[#1877F2]" />
                  <span>{proj.kode_proyek}</span>
                </div>
                <div className="rounded-2xl rounded-tl-none border border-blue-200 bg-white p-5 shadow-xs transition group-hover:border-[#1877F2] group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="truncate text-sm font-bold text-gray-900 group-hover:text-[#1877F2]">
                        {proj.nama_proyek}
                      </div>
                      <div className="truncate text-[11px] text-gray-500">
                        {proj.dinas_pemberi_kerja}
                      </div>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2]">
                      <FolderArchive className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px] font-semibold text-[#1877F2]">
                    <span>Buka Folder Arsip</span>
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      ) : isLoading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : archives.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center space-y-3 shadow-sm">
          <FolderArchive className="mx-auto h-8 w-8 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">
            {activeProject
              ? `Folder ${activeProject.kode_proyek} masih kosong`
              : 'Arsip tidak ditemukan di repositori'}
          </p>
          <p className="text-xs text-gray-400">
            {activeProject
              ? 'Belum ada dokumen arsip yang tercatat pada proyek ini.'
              : 'Coba ubah filter pencarian atau catat dokumen arsip baru.'}
          </p>
          {activeProject && (
            <button
              type="button"
              onClick={() => {
                setFilterProjectId('');
                setViewMode('folder');
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-[#1877F2] hover:bg-blue-100"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Folder Proyek</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {archives.map((item) => (
              <div
                key={item.id_arsip}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#1877F2]">
                    {item.kode_arsip}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getTipeBadge(
                      item.tipe_penyimpanan
                    )}`}
                  >
                    {item.tipe_penyimpanan}
                  </span>
                </div>

                <h4 className="text-xs font-bold leading-snug text-gray-900">
                  {item.judul_dokumen}
                </h4>

                <div className="text-[11px] font-mono text-gray-600">
                  No. Surat: <strong>{item.nomor_surat}</strong>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{item.jenis_arsip}</span>
                  <span>{formatTanggal(item.tanggal_arsip)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <FolderArchive className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{getLokasiLabel(item)}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleOpenDetail(item)}
                    className="flex-1 rounded-xl bg-[#1877F2] py-2 text-xs font-semibold text-white hover:bg-blue-600"
                  >
                    Rincian
                  </button>
                  {allowDelete && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      aria-label={`Hapus ${item.kode_arsip}`}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (ARS-02: Nomor Surat sebagai kolom terpisah) */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="py-3 pl-5 pr-2">Kode Arsip</th>
                    <th className="py-3 px-2">Nomor Surat</th>
                    <th className="py-3 px-2">Judul Dokumen &amp; Proyek</th>
                    <th className="py-3 px-2">Tanggal</th>
                    <th className="py-3 px-2 text-center">Jenis</th>
                    <th className="py-3 px-2 text-center">Tipe</th>
                    <th className="py-3 px-2">Lokasi Fisik</th>
                    <th className="py-3 pl-2 pr-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                  {archives.map((item) => (
                    <tr key={item.id_arsip} className="transition hover:bg-blue-50/40">
                      <td className="py-3.5 pl-5 pr-2 font-mono text-[11px] font-semibold text-[#1877F2]">
                        {item.kode_arsip}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-[11px] font-medium text-gray-700 whitespace-nowrap">
                        {item.nomor_surat}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="font-medium text-gray-900">{item.judul_dokumen}</div>
                        <div className="text-[10px] text-gray-400">
                          {item.proyek?.kode_proyek ? `${item.proyek.kode_proyek} • ` : ''}
                          {item.proyek?.nama_proyek || `Proyek #${item.id_proyek}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 whitespace-nowrap text-gray-600">
                        {formatTanggal(item.tanggal_arsip)}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                          {item.jenis_arsip}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getTipeBadge(
                            item.tipe_penyimpanan
                          )}`}
                        >
                          {item.tipe_penyimpanan}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-gray-700">{getLokasiLabel(item)}</td>
                      <td className="py-3.5 pl-2 pr-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleOpenDetail(item)}
                            className="rounded-lg bg-[#1877F2] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-600"
                          >
                            Rincian
                          </button>
                          {allowDelete && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(item)}
                              className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-rose-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer (ARS-04) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3.5 text-xs text-gray-600 shadow-sm">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <div className="w-28">
                <CustomSelect
                  ariaLabel="Jumlah item per halaman"
                  value={perPage}
                  onChange={(val) => {
                    setPerPage(val as '10' | '25' | '50' | 'all');
                    setPage(1);
                  }}
                  options={[
                    { value: '10', label: '10 item' },
                    { value: '25', label: '25 item' },
                    { value: '50', label: '50 item' },
                    { value: 'all', label: 'Semua' },
                  ]}
                />
              </div>
              <span className="text-gray-400">
                Total <strong>{meta.total}</strong> arsip
              </span>
            </div>

            {meta.last_page > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>
                <span className="px-2 font-semibold text-gray-700">
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Detail + Preview Inline + Cetak Label (ARS-12, ARS-13, ARS-14) */}
      {(selectedDetail || loadingDetail) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          onClick={closeDetailModal}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="min-w-0 pr-2">
                <h3 className="text-base font-bold text-gray-900">Rincian &amp; Pratinjau Arsip</h3>
                {selectedDetail && (
                  <p className="truncate text-[11px] font-mono text-[#1877F2]">
                    {selectedDetail.kode_arsip} • No. Surat: {selectedDetail.nomor_surat}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Tutup rincian arsip"
                onClick={closeDetailModal}
                className="shrink-0 rounded-full bg-slate-100 p-2 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetail || !selectedDetail ? (
              <div className="flex items-center justify-center gap-2 py-16 text-xs text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#1877F2]" />
                <span>Memuat detail arsip…</span>
              </div>
            ) : (
              <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-12">
                {/* Panel Kiri: Preview Dokumen Langsung di Website */}
                <div className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 lg:col-span-7 sm:min-h-[340px]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3.5 py-2.5 text-xs sm:px-4">
                    <span className="flex items-center gap-2 font-semibold text-gray-800">
                      <FileText className="h-4 w-4 text-[#1877F2]" />
                      <span>Pratinjau Dokumen</span>
                    </span>
                    {selectedDetail.path_digital && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {previewObjectUrl && (
                          <>
                            {!isPdfPreview && isImagePreview && (
                              <div className="inline-flex items-center rounded-full border border-gray-200 bg-slate-50 p-0.5 text-[11px]">
                                <button
                                  type="button"
                                  aria-label="Perkecil pratinjau arsip"
                                  onClick={() => setPreviewZoom((z) => Math.max(50, z - 25))}
                                  className="rounded-full p-1 text-gray-600 hover:bg-white hover:text-[#1877F2]"
                                >
                                  <ZoomOut className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Reset zoom pratinjau arsip"
                                  onClick={() => setPreviewZoom(100)}
                                  className="px-1.5 font-mono text-[10px] font-semibold text-gray-700"
                                >
                                  {previewZoom}%
                                </button>
                                <button
                                  type="button"
                                  aria-label="Perbesar pratinjau arsip"
                                  onClick={() => setPreviewZoom((z) => Math.min(200, z + 25))}
                                  className="rounded-full p-1 text-gray-600 hover:bg-white hover:text-[#1877F2]"
                                >
                                  <ZoomIn className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                window.open(previewObjectUrl, '_blank', 'noopener,noreferrer')
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="hidden sm:inline">Tab Baru</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDownloadArchive(selectedDetail)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-600"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Unduh</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 items-center justify-center overflow-auto p-3">
                    {!selectedDetail.path_digital ? (
                      <div className="text-center text-xs text-gray-500 space-y-1.5 p-6">
                        <FolderArchive className="mx-auto h-10 w-10 text-gray-300" />
                        <div className="font-semibold text-gray-700">Arsip Fisik Murni</div>
                        <p>Dokumen ini disimpan dalam binder fisik tanpa lampiran digital.</p>
                      </div>
                    ) : previewLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin text-[#1877F2]" />
                        <span>Memuat berkas dokumen…</span>
                      </div>
                    ) : previewError ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                        {previewError}
                      </div>
                    ) : previewObjectUrl ? (
                      isPdfPreview ? (
                        <>
                          <div className="hidden w-full sm:block">
                            <div className="relative isolate h-[460px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                              <iframe
                                title={`Preview ${selectedDetail.judul_dokumen}`}
                                src={previewObjectUrl}
                                className="h-full w-full border-0 bg-white"
                              />
                            </div>
                          </div>
                          <div className="w-full sm:hidden">
                            <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1877F2]">
                                <FileText className="h-6 w-6" />
                              </div>
                              <div className="w-full truncate text-xs font-bold text-gray-900">
                                {selectedDetail.judul_dokumen}
                              </div>
                              <div className="mt-0.5 w-full truncate font-mono text-[11px] text-[#1877F2]">
                                {selectedDetail.kode_arsip}
                              </div>
                              <p className="mt-2 text-[11px] text-gray-500">
                                Pratinjau PDF di layar kecil dibuka di tab baru agar tampilan tetap rapi.
                              </p>
                              <div className="mt-4 flex w-full flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(previewObjectUrl, '_blank', 'noopener,noreferrer')
                                  }
                                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Buka PDF di Tab Baru</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDownloadArchive(selectedDetail)}
                                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Unduh</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex max-h-[460px] w-full items-center justify-center overflow-auto">
                          <img
                            src={previewObjectUrl}
                            alt={selectedDetail.judul_dokumen}
                            style={{ width: previewZoom === 100 ? undefined : `${previewZoom}%` }}
                            className={
                              previewZoom === 100
                                ? 'max-h-[440px] w-auto rounded-xl object-contain shadow-sm'
                                : 'h-auto max-w-none rounded-xl object-contain shadow-sm'
                            }
                          />
                        </div>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Panel Kanan: Metadata, Koordinat Fisik & Cetak Label */}
                <div className="space-y-4 text-xs lg:col-span-5">
                  <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getTipeBadge(
                          selectedDetail.tipe_penyimpanan
                        )}`}
                      >
                        {selectedDetail.tipe_penyimpanan}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {selectedDetail.jenis_arsip}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-gray-900">
                      {selectedDetail.judul_dokumen}
                    </div>

                    <dl className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600">
                      <div>
                        <dt className="text-gray-400">Nomor Surat</dt>
                        <dd className="font-mono font-semibold text-gray-800">
                          {selectedDetail.nomor_surat}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Tanggal Arsip</dt>
                        <dd className="font-semibold text-gray-800">
                          {formatTanggal(selectedDetail.tanggal_arsip)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Penyedia / Pihak</dt>
                        <dd className="font-semibold text-gray-800">
                          {selectedDetail.pihak_penyedia}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Proyek</dt>
                        <dd className="font-semibold text-gray-800">
                          {selectedDetail.proyek?.kode_proyek} — {selectedDetail.proyek?.nama_proyek}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-gray-400">Jenis Transaksi</dt>
                        <dd className="font-semibold text-gray-800">
                          {selectedDetail.jenis_transaksi}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Koordinat Fisik */}
                  {selectedDetail.tipe_penyimpanan !== 'Digital' && (
                    <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">Koordinat Lokasi Fisik</span>
                        {allowEditLocation && !editLocationMode && (
                          <button
                            type="button"
                            onClick={() => setEditLocationMode(true)}
                            className="flex items-center gap-1 font-semibold text-[#1877F2] hover:underline"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Ubah Lokasi</span>
                          </button>
                        )}
                      </div>

                      {editLocError && <FieldError message={editLocError} />}

                      {editLocationMode ? (
                        <form onSubmit={handleSaveLocation} className="space-y-2.5">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editRuang}
                              onChange={(e) => setEditRuang(e.target.value)}
                              placeholder="Ruang simpan"
                              className="rounded-xl border border-gray-200 bg-slate-50 px-2.5 py-2 text-xs"
                            />
                            <input
                              type="text"
                              value={editRak}
                              onChange={(e) => setEditRak(e.target.value)}
                              placeholder="No. Rak"
                              className="rounded-xl border border-gray-200 bg-slate-50 px-2.5 py-2 text-xs"
                            />
                            <input
                              type="text"
                              value={editBinder}
                              onChange={(e) => setEditBinder(e.target.value)}
                              placeholder="No. Binder"
                              className="rounded-xl border border-gray-200 bg-slate-50 px-2.5 py-2 text-xs"
                            />
                          </div>
                          <input
                            type="text"
                            value={editKeterangan}
                            onChange={(e) => setEditKeterangan(e.target.value)}
                            placeholder="Keterangan posisi tambahan (opsional)"
                            className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditLocationMode(false)}
                              className="rounded-xl border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={savingEdit}
                              className="rounded-xl bg-[#1877F2] px-4 py-1.5 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                            >
                              {savingEdit ? 'Menyimpan…' : 'Simpan Lokasi'}
                            </button>
                          </div>
                        </form>
                      ) : selectedDetail.lokasi_arsip_fisik ? (
                        <div className="space-y-1 text-gray-700">
                          <div>
                            Ruang: <strong>{selectedDetail.lokasi_arsip_fisik.ruang_simpan}</strong>{' '}
                            • Rak: <strong>{selectedDetail.lokasi_arsip_fisik.nomor_rak}</strong> •
                            Binder: <strong>{selectedDetail.lokasi_arsip_fisik.nomor_binder}</strong>
                          </div>
                          {selectedDetail.lokasi_arsip_fisik.keterangan_posisi && (
                            <div className="text-gray-500">
                              Catatan: {selectedDetail.lokasi_arsip_fisik.keterangan_posisi}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400">Koordinat fisik belum dicatat.</div>
                      )}
                    </div>
                  )}

                  {/* Aksi Rincian: Cetak Label Kapan Saja + Unduh (ARS-13, ARS-14) */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const loc = selectedDetail.lokasi_arsip_fisik;
                        setStickerModalData({
                          label_stiker: `LABEL-${selectedDetail.kode_arsip}`,
                          koordinat_label: loc
                            ? `${loc.ruang_simpan}/${loc.nomor_rak}/${loc.nomor_binder}`
                            : 'DIGITAL-ONLY',
                          judul_dokumen: selectedDetail.judul_dokumen,
                          nomor_surat: selectedDetail.nomor_surat,
                        });
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#1877F2] hover:bg-blue-100"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Label</span>
                    </button>

                    {selectedDetail.path_digital && (
                      <button
                        type="button"
                        onClick={() => void handleDownloadArchive(selectedDetail)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Unduh Berkas</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Catat Arsip Baru (ARS-07..ARS-11, GLB-01, GLB-06, GLB-07, GLB-12) */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setIsCreateOpen(false)}
        >
          <form
            onSubmit={handleCreateArchive}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl space-y-4 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Catat Arsip Baru</h3>
              <button
                type="button"
                aria-label="Tutup form arsip"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {createError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">Proyek</label>
                <CustomSelect
                  ariaLabel="Pilih Proyek"
                  searchable
                  hasError={Boolean(fieldErrors.project)}
                  value={effectiveProjectId}
                  onChange={(val) => {
                    setFormProjectId(val);
                    setFieldErrors((prev) => ({ ...prev, project: undefined }));
                  }}
                  options={projects.map((p) => ({
                    value: String(p.id_proyek),
                    label: `${p.kode_proyek} — ${p.nama_proyek}`,
                  }))}
                  placeholder="Pilih proyek..."
                />
                <FieldError message={fieldErrors.project} />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">Judul Dokumen</label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => {
                    setFormJudul(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, judul: undefined }));
                  }}
                  placeholder="Misal: Berita Acara Mutu Beton K-350"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
                <FieldError message={fieldErrors.judul} />
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Nomor Surat</label>
                  <input
                    type="text"
                    value={formNomorSurat}
                    onChange={(e) => {
                      setFormNomorSurat(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, nomorSurat: undefined }));
                    }}
                    placeholder="BA/2026/001"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                  />
                  <FieldError message={fieldErrors.nomorSurat} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Tanggal Arsip</label>
                  <WheelDatePicker
                    ariaLabel="Tanggal Arsip"
                    hasError={Boolean(fieldErrors.tanggal)}
                    value={formTanggal}
                    onChange={(val) => {
                      setFormTanggal(val);
                      setFieldErrors((prev) => ({ ...prev, tanggal: undefined }));
                    }}
                  />
                  <FieldError message={fieldErrors.tanggal} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Jenis Arsip</label>
                  <CustomSelect
                    ariaLabel="Jenis Arsip"
                    value={formJenisArsip}
                    onChange={(val) => setFormJenisArsip(val)}
                    options={JENIS_ARSIP_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Tipe Penyimpanan</label>
                  <CustomSelect
                    ariaLabel="Tipe Penyimpanan"
                    value={formTipe}
                    onChange={(val) => {
                      setFormTipe(val as StorageType);
                      setFieldErrors((prev) => ({
                        ...prev,
                        file: undefined,
                        ruang: undefined,
                        rak: undefined,
                        binder: undefined,
                      }));
                    }}
                    options={[
                      { value: 'Hibrida', label: 'Hibrida (Fisik + Digital)' },
                      { value: 'Fisik', label: 'Fisik Murni' },
                      { value: 'Digital', label: 'Digital Murni' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Jenis Transaksi</label>
                  <input
                    type="text"
                    value={formJenisTransaksi}
                    onChange={(e) => {
                      setFormJenisTransaksi(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, jenisTransaksi: undefined }));
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                  />
                  <FieldError message={fieldErrors.jenisTransaksi} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Pihak / Penyedia</label>
                  <input
                    type="text"
                    value={formPihakPenyedia}
                    onChange={(e) => {
                      setFormPihakPenyedia(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, pihakPenyedia: undefined }));
                    }}
                    placeholder="PT / Dinas terkait"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                  />
                  <FieldError message={fieldErrors.pihakPenyedia} />
                </div>
              </div>

              {/* ARS-07: Biru tema + teks label putih + input putih */}
              {formTipe !== 'Digital' && (
                <div className="rounded-2xl bg-[#1877F2] p-4 shadow-sm space-y-2.5">
                  <div className="font-bold text-white">Koordinat Penyimpanan Fisik</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="text"
                        value={formRuang}
                        onChange={(e) => {
                          setFormRuang(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, ruang: undefined }));
                        }}
                        placeholder="Ruang simpan"
                        className="w-full rounded-xl border border-white/80 bg-white px-2.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                      />
                      {fieldErrors.ruang && (
                        <p className="mt-1 text-[10px] font-semibold text-rose-100">
                          {fieldErrors.ruang}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formRak}
                        onChange={(e) => {
                          setFormRak(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, rak: undefined }));
                        }}
                        placeholder="Rak (B-02)"
                        className="w-full rounded-xl border border-white/80 bg-white px-2.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                      />
                      {fieldErrors.rak && (
                        <p className="mt-1 text-[10px] font-semibold text-rose-100">
                          {fieldErrors.rak}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formBinder}
                        onChange={(e) => {
                          setFormBinder(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, binder: undefined }));
                        }}
                        placeholder="Binder (01)"
                        className="w-full rounded-xl border border-white/80 bg-white px-2.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                      />
                      {fieldErrors.binder && (
                        <p className="mt-1 text-[10px] font-semibold text-rose-100">
                          {fieldErrors.binder}
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Keterangan posisi (opsional)"
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              )}

              {/* ARS-08, ARS-09, ARS-10, A2: Kartu pratinjau file ringkas menggantikan kotak dropzone setelah file diunggah */}
              {formTipe !== 'Fisik' ? (
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    Unggah Salinan Digital (Wajib — PDF / JPG / PNG, maks. 10 MB)
                  </label>
                  {formFile ? (
                    <UploadedArchiveFileCard
                      file={formFile}
                      onPreview={() => setLocalPreviewOpen(true)}
                      onPickFile={handlePickedFile}
                      onRemove={() => setFormFile(null)}
                    />
                  ) : (
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        handlePickedFile(e.dataTransfer.files?.[0] ?? null);
                      }}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-5 text-center transition ${
                        isDraggingFile
                          ? 'border-[#1877F2] bg-blue-50'
                          : fieldErrors.file
                            ? 'border-rose-400 bg-rose-50/40'
                            : 'border-gray-300 bg-slate-50 hover:border-[#1877F2] hover:bg-blue-50/30'
                      }`}
                    >
                      <Upload className="h-5 w-5 text-[#1877F2]" />
                      <span className="font-semibold text-gray-700">
                        Tarik &amp; lepas file ke sini, atau klik untuk memilih berkas
                      </span>
                      <span className="text-[10px] text-gray-400">
                        PDF, JPG, JPEG, atau PNG (maks. 10 MB)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          handlePickedFile(e.target.files?.[0] ?? null);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  <FieldError message={fieldErrors.file} />
                </div>
              ) : (
                formFile && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-[#1877F2]">
                    <span className="truncate">
                      File tersimpan sementara ({formFile.name}, {formatFileSize(formFile.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormFile(null)}
                      className="ml-2 font-semibold text-rose-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-[#1877F2] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {creating ? 'Menyimpan…' : 'Simpan & Buat Label'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Label Stiker Arsip (dipicu setelah Catat atau dari Rincian ARS-14) */}
      {(createdResult || stickerModalData) && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setCreatedResult(null);
            setStickerModalData(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl space-y-4"
          >
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">
              {createdResult ? 'Arsip Berhasil Dicatat' : 'Label Stiker Binder Arsip'}
            </h3>
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-slate-50 p-4 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Label Stiker Binder
              </div>
              <div className="font-mono text-base font-black text-gray-900">
                {createdResult?.label_stiker ?? stickerModalData?.label_stiker}
              </div>
              <div className="text-xs font-semibold text-[#1877F2]">
                {createdResult?.koordinat_label ?? stickerModalData?.koordinat_label}
              </div>
              <div className="text-[11px] text-gray-500">
                {createdResult?.arsip.judul_dokumen ?? stickerModalData?.judul_dokumen}
              </div>
              {stickerModalData?.nomor_surat && (
                <div className="text-[10px] font-mono text-gray-400">
                  No. {stickerModalData.nomor_surat}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Label</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedResult(null);
                  setStickerModalData(null);
                }}
                className="flex-1 rounded-full bg-[#1877F2] py-2 text-xs font-semibold text-white hover:bg-blue-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {localPreviewOpen && formFile && (
        <DocumentPreviewModal
          title={formFile.name}
          subtitle={`Pratinjau berkas sebelum disimpan (${formatFileSize(formFile.size)})`}
          localFile={formFile}
          fileNameHint={formFile.name}
          onClose={() => setLocalPreviewOpen(false)}
        />
      )}
    </div>
  );
};
