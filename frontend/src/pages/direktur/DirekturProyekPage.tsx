import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  earlyWarningService,
  projectService,
  userService,
  type CreateTerminItemPayload,
  type EarlyWarningAnalysis,
  type ProjectListItem,
  type ProjectStatus,
  type User,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import { EarlyWarningStatusBadge } from '../../components/common/EarlyWarningVisuals';
import { ProjectMonitoringPanel } from '../../components/common/ProjectMonitoringPanel';
import {
  CurrencyInput,
  CustomCheckbox,
  CustomSelect,
  FieldError,
  NumberInput,
  SkeletonTable,
  WheelDatePicker,
} from '../../components/ui';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  FolderKanban,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';

function defaultTerminRows(kontrak: number): CreateTerminItemPayload[] {
  const nowMs = Date.now();
  return [
    {
      nomor_termin: 1,
      target_persentase: 30,
      nilai_tagihan: Math.round(kontrak * 0.3),
      tenggat_waktu: new Date(nowMs + 60 * 86400_000).toISOString().slice(0, 10),
    },
    {
      nomor_termin: 2,
      target_persentase: 70,
      nilai_tagihan: Math.round(kontrak * 0.4),
      tenggat_waktu: new Date(nowMs + 120 * 86400_000).toISOString().slice(0, 10),
    },
    {
      nomor_termin: 3,
      target_persentase: 100,
      nilai_tagihan: Math.round(kontrak * 0.3),
      tenggat_waktu: new Date(nowMs + 170 * 86400_000).toISOString().slice(0, 10),
    },
  ];
}

export const DirekturProyekPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { confirm, showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const {
    data: projects = [],
    isLoading,
    error: queryError,
  } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'direktur-list'],
    queryFn: () => projectService.getProjects(),
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['users', 'direktur-for-projects'],
    queryFn: () => userService.getUsers(),
  });
  const adminUsers = allUsers.filter((u) => u.peran === 'AdminLapangan' && u.status_aktif);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [monitoringProject, setMonitoringProject] = useState<ProjectListItem | null>(null);

  const { data: monitoringEw } = useQuery<EarlyWarningAnalysis>({
    queryKey: ['early-warning', 'direktur-monitor', monitoringProject?.id_proyek],
    enabled: Boolean(monitoringProject),
    queryFn: () => earlyWarningService.getProjectAnalysis(monitoringProject!.id_proyek),
  });

  const [namaProyek, setNamaProyek] = useState('');
  const [dinas, setDinas] = useState('');
  const [statusProyek, setStatusProyek] = useState<ProjectStatus>('Aktif');
  const [nilaiKontrak, setNilaiKontrak] = useState(1000000000);
  const [totalPagu, setTotalPagu] = useState(850000000);
  const [tanggalMulai, setTanggalMulai] = useState(() => new Date().toISOString().slice(0, 10));
  const [tanggalSelesai, setTanggalSelesai] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });
  const [terminList, setTerminList] = useState<CreateTerminItemPayload[]>(() =>
    defaultTerminRows(1000000000)
  );
  const [assignedAdmins, setAssignedAdmins] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const openCreateModal = () => {
    const start = new Date().toISOString().slice(0, 10);
    const endD = new Date();
    endD.setMonth(endD.getMonth() + 6);
    const end = endD.toISOString().slice(0, 10);

    setEditingId(null);
    setNamaProyek('');
    setDinas('');
    setStatusProyek('Aktif');
    setNilaiKontrak(1000000000);
    setTotalPagu(850000000);
    setTanggalMulai(start);
    setTanggalSelesai(end);
    setTerminList(defaultTerminRows(1000000000));
    setAssignedAdmins(adminUsers.map((u) => u.id_pengguna));
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (proj: ProjectListItem) => {
    setLoadingEdit(true);
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
    setEditingId(proj.id_proyek);

    try {
      const detail = await projectService.getProjectDetail(proj.id_proyek);
      const p = detail.proyek;
      setNamaProyek(p.nama_proyek);
      setDinas(p.dinas_pemberi_kerja);
      setStatusProyek(p.status_proyek || 'Aktif');
      setNilaiKontrak(Number(p.nilai_kontrak) || 0);
      setTotalPagu(Number(p.rab?.total_pagu ?? 0));
      setTanggalMulai(String(p.tanggal_mulai).slice(0, 10));
      setTanggalSelesai(String(p.tanggal_selesai).slice(0, 10));
      setAssignedAdmins(
        (p.admin_lapangan_akses ?? []).map((u) => u.id_pengguna)
      );
      setTerminList(
        (p.termin ?? []).map((t) => ({
          id_termin: t.id_termin,
          nomor_termin: t.nomor_termin,
          target_persentase: Number(t.target_persentase),
          nilai_tagihan: Number(t.nilai_tagihan),
          tenggat_waktu: String(t.tenggat_waktu).slice(0, 10),
        }))
      );
    } catch (err: unknown) {
      setIsModalOpen(false);
      showToast({
        type: 'error',
        message: extractApiError(err, 'Gagal memuat rincian proyek untuk diedit.'),
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteProject = async (proj: ProjectListItem) => {
    const ok = await confirm({
      title: 'Hapus Proyek Permanen',
      message: `Yakin ingin menghapus proyek ${proj.kode_proyek} (${proj.nama_proyek}) beserta RAB, termin, dan seluruh riwayatnya?`,
      confirmLabel: 'Ya, Hapus Proyek',
      cancelLabel: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await projectService.deleteProject(proj.id_proyek);
      showToast({ type: 'success', message: `Proyek ${proj.kode_proyek} berhasil dihapus.` });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['early-warning'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: extractApiError(err, 'Gagal menghapus proyek.'),
      });
    }
  };

  const sumTagihan = terminList.reduce((acc, t) => acc + (Number(t.nilai_tagihan) || 0), 0);
  const diffTagihan = nilaiKontrak - sumTagihan;
  const maxTargetPct =
    terminList.length > 0
      ? Number(terminList[terminList.length - 1].target_persentase) || 0
      : 0;

  const isTagihanMatch = Math.abs(diffTagihan) <= 0.01 && nilaiKontrak > 0;
  const isDateRangeValid = Boolean(
    tanggalMulai && tanggalSelesai && tanggalSelesai >= tanggalMulai
  );
  const areTerminDatesValid = terminList.every(
    (t) => t.tenggat_waktu >= tanggalMulai && t.tenggat_waktu <= tanggalSelesai
  );
  const isFormReady =
    isTagihanMatch && isDateRangeValid && areTerminDatesValid && terminList.length > 0;

  const recalcNominalFromPercent = (rows: CreateTerminItemPayload[], kontrak: number) => {
    return rows.map((row, idx) => {
      const prevPct = idx === 0 ? 0 : Number(rows[idx - 1].target_persentase) || 0;
      const curPct = Number(row.target_persentase) || 0;
      const deltaPct = Math.max(0, curPct - prevPct);
      return {
        ...row,
        nilai_tagihan: Math.round((kontrak * deltaPct) / 100),
      };
    });
  };

  const handleAddTermin = () => {
    setTerminList((prev) => {
      const next = [
        ...prev,
        {
          nomor_termin: prev.length + 1,
          target_persentase: 100,
          nilai_tagihan: 0,
          tenggat_waktu: tanggalSelesai,
        },
      ];
      return next;
    });
  };

  const handleRemoveTermin = (idx: number) => {
    setTerminList((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((t, i) => ({ ...t, nomor_termin: i + 1 }))
    );
  };

  const handleTerminPercentChange = (idx: number, pct: number) => {
    setTerminList((prev) => {
      const updated = prev.map((item, i) =>
        i === idx ? { ...item, target_persentase: Math.min(100, Math.max(0, pct)) } : item
      );
      return recalcNominalFromPercent(updated, nilaiKontrak);
    });
  };

  const handleTerminNominalChange = (idx: number, nominal: number) => {
    setTerminList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, nilai_tagihan: nominal } : item))
    );
  };

  const handleTerminDateChange = (idx: number, dateStr: string) => {
    setTerminList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, tenggat_waktu: dateStr } : item))
    );
  };

  const toggleAdminAccess = (uid: number) => {
    setAssignedAdmins((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string | undefined> = {};
    if (!namaProyek.trim()) errs.namaProyek = 'Nama proyek wajib diisi.';
    if (!dinas.trim()) errs.dinas = 'Dinas pemberi kerja wajib diisi.';
    if (nilaiKontrak <= 0) errs.nilaiKontrak = 'Nilai kontrak harus lebih besar dari Rp 0.';
    if (!isDateRangeValid) {
      errs.tanggal = 'Tanggal selesai harus sama atau sesudah tanggal mulai.';
    }
    if (Object.values(errs).some(Boolean)) {
      setFieldErrors(errs);
      return;
    }
    if (!isFormReady) {
      setFormError('Pastikan akumulasi nilai tagihan termin sama dengan nilai kontrak dan tenggat valid.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingId) {
        await projectService.updateProject(editingId, {
          nama_proyek: namaProyek.trim(),
          dinas_pemberi_kerja: dinas.trim(),
          nilai_kontrak: nilaiKontrak,
          total_pagu: totalPagu,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          status_proyek: statusProyek,
          admin_lapangan_ids: assignedAdmins,
          termin: terminList,
        });
        showToast({ type: 'success', message: 'Data proyek dan RAB berhasil diperbarui.' });
      } else {
        await projectService.createProject({
          nama_proyek: namaProyek.trim(),
          dinas_pemberi_kerja: dinas.trim(),
          nilai_kontrak: nilaiKontrak,
          total_pagu: totalPagu,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          admin_lapangan_ids: assignedAdmins,
          termin: terminList,
        });
        showToast({ type: 'success', message: 'Proyek baru dan RAB berhasil disimpan.' });
      }
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['early-warning'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setFormError(extractApiError(err, 'Gagal menyimpan data proyek.'));
    } finally {
      setSubmitting(false);
    }
  };

  const errorMsg = queryError ? extractApiError(queryError, 'Gagal memuat daftar proyek.') : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
            Manajemen Proyek &amp; RAB
          </h1>
          <p className="text-xs text-gray-500">
            Registrasi, pembaruan kontrak proyek, penetapan pagu RAB, dan jadwal termin
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1877F2] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Proyek Baru</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center space-y-2 shadow-sm">
          <FolderKanban className="mx-auto h-8 w-8 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Belum ada proyek terdaftar</p>
          <p className="text-xs text-gray-400">Klik tombol Buat Proyek Baru untuk memulai.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="py-3 pl-6 pr-3">Kode</th>
                  <th className="py-3 px-3">Proyek &amp; Dinas</th>
                  <th className="py-3 px-3">Nilai Kontrak</th>
                  <th className="py-3 px-3">Sisa / Total Pagu RAB</th>
                  <th className="py-3 px-3">Akses Lapangan</th>
                  <th className="py-3 px-3">Progres</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 pr-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                {projects.map((p) => (
                  <tr key={p.id_proyek} className="transition hover:bg-blue-50/40">
                    <td className="py-3.5 pl-6 pr-3 font-mono font-bold text-[#1877F2]">
                      {p.kode_proyek}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-gray-900">{p.nama_proyek}</div>
                      <div className="text-[10px] text-gray-400">
                        {p.dinas_pemberi_kerja} • {formatTanggal(p.tanggal_mulai)} s/d{' '}
                        {formatTanggal(p.tanggal_selesai)}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold">
                      {formatRupiah(p.nilai_kontrak)}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-[#1877F2]">
                        {formatRupiah(p.ringkasan_rab.sisa_pagu)}
                      </div>
                      <div className="font-mono text-[10px] text-gray-400">
                        dari {formatRupiah(p.ringkasan_rab.total_pagu)} (v{p.ringkasan_rab.versi_rab})
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      {p.admin_lapangan && p.admin_lapangan.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.admin_lapangan.map((adm) => (
                            <span
                              key={adm.id_pengguna}
                              className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#1877F2]"
                            >
                              {adm.nama}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600">Belum ditugaskan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-gray-900">
                      {p.progres_fisik_terakhir.persentase_realisasi}%
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {p.status_proyek}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 pr-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMonitoringProject(p)}
                          aria-label={`Pantau progres dan kendala ${p.kode_proyek}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-[#1877F2] hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Pantau</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void openEditModal(p)}
                          aria-label={`Edit proyek ${p.kode_proyek}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
                        >
                          <Edit3 className="h-3 w-3 text-[#1877F2]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProject(p)}
                          aria-label={`Hapus proyek ${p.kode_proyek}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-rose-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Buat / Edit Proyek (DIR-03..DIR-06, GLB-06, GLB-14) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? 'Perbarui Data Proyek & RAB' : 'Buat Proyek & RAB Baru'}
              </h3>
              <button
                type="button"
                aria-label="Tutup modal proyek"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingEdit ? (
              <div className="py-8">
                <SkeletonTable rows={3} cols={4} />
              </div>
            ) : (
              <>
                {formError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Nama Proyek</label>
                    <input
                      type="text"
                      value={namaProyek}
                      onChange={(e) => {
                        setNamaProyek(e.target.value);
                        setFieldErrors((p) => ({ ...p, namaProyek: undefined }));
                      }}
                      placeholder="Misal: Pembangunan Jembatan Sungai Brantas"
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                    />
                    <FieldError message={fieldErrors.namaProyek} />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Dinas Pemberi Kerja
                    </label>
                    <input
                      type="text"
                      value={dinas}
                      onChange={(e) => {
                        setDinas(e.target.value);
                        setFieldErrors((p) => ({ ...p, dinas: undefined }));
                      }}
                      placeholder="Misal: Dinas PUPR Provinsi"
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                    />
                    <FieldError message={fieldErrors.dinas} />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Nilai Kontrak (Rp)
                    </label>
                    <CurrencyInput
                      ariaLabel="Nilai Kontrak"
                      hasError={Boolean(fieldErrors.nilaiKontrak)}
                      value={nilaiKontrak}
                      onChange={(val) => {
                        setNilaiKontrak(val);
                        setTerminList((prev) => recalcNominalFromPercent(prev, val));
                        setFieldErrors((p) => ({ ...p, nilaiKontrak: undefined }));
                      }}
                    />
                    <FieldError message={fieldErrors.nilaiKontrak} />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Total Pagu RAB (Rp)
                    </label>
                    <CurrencyInput
                      ariaLabel="Total Pagu RAB"
                      value={totalPagu}
                      onChange={(val) => setTotalPagu(val)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">Tanggal Mulai</label>
                    <WheelDatePicker
                      ariaLabel="Tanggal Mulai Kontrak"
                      value={tanggalMulai}
                      onChange={(val) => {
                        setTanggalMulai(val);
                        setFieldErrors((p) => ({ ...p, tanggal: undefined }));
                      }}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Tanggal Selesai
                    </label>
                    <WheelDatePicker
                      ariaLabel="Tanggal Selesai Kontrak"
                      hasError={Boolean(fieldErrors.tanggal)}
                      value={tanggalSelesai}
                      onChange={(val) => {
                        setTanggalSelesai(val);
                        setFieldErrors((p) => ({ ...p, tanggal: undefined }));
                      }}
                    />
                    <FieldError message={fieldErrors.tanggal} />
                  </div>

                  {editingId && (
                    <div>
                      <label className="mb-1 block font-semibold text-gray-700">Status Proyek</label>
                      <CustomSelect
                        ariaLabel="Status Proyek"
                        value={statusProyek}
                        onChange={(val) => setStatusProyek(val)}
                        options={[
                          { value: 'Aktif', label: 'Aktif' },
                          { value: 'Selesai', label: 'Selesai' },
                          { value: 'Ditunda', label: 'Ditunda' },
                        ]}
                      />
                    </div>
                  )}
                </div>

                {/* Hak Akses Admin Lapangan (GLB-14) */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                    <Users className="h-3.5 w-3.5 text-[#1877F2]" />
                    <span>Penugasan Admin Lapangan (Hak Akses Proyek)</span>
                  </div>
                  {adminUsers.length === 0 ? (
                    <p className="text-[11px] text-gray-400">
                      Belum ada akun Admin Lapangan aktif.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {adminUsers.map((adm) => (
                        <CustomCheckbox
                          key={adm.id_pengguna}
                          checked={assignedAdmins.includes(adm.id_pengguna)}
                          onChange={() => toggleAdminAccess(adm.id_pengguna)}
                          label={adm.nama}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Jadwal Pentahapan Termin (DIR-04, DIR-05, DIR-06) */}
                <div className="space-y-2.5 border-t border-gray-100 pt-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-gray-800">Jadwal Pentahapan Termin</span>
                      <p className="text-[11px] text-gray-500">
                        Isi target progres kumulatif (%) hingga 100% (misal: Termin 1 = 30%,
                        Termin 2 = 70%, Termin 3 = 100%). Nilai tagihan otomatis terhitung dan
                        tetap bisa disesuaikan manual.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTermin}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-[#1877F2] hover:bg-blue-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Termin</span>
                    </button>
                  </div>

                  {/* Header kolom jelas */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <div className="col-span-2">Tahap</div>
                    <div className="col-span-3">Target Kumulatif (%)</div>
                    <div className="col-span-4">Nilai Tagihan (Rp)</div>
                    <div className="col-span-2">Tenggat</div>
                    <div className="col-span-1 text-right">Hapus</div>
                  </div>

                  <div className="space-y-2">
                    {terminList.map((t, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 items-center gap-2 rounded-xl border border-gray-100 bg-slate-50 p-2.5 sm:grid-cols-12"
                      >
                        <div className="font-bold text-gray-700 sm:col-span-2">
                          Termin {t.nomor_termin}
                        </div>

                        <div className="relative sm:col-span-3">
                          <label className="mb-0.5 block text-[10px] text-gray-400 sm:hidden">
                            Target Progres (%)
                          </label>
                          <div className="relative flex items-center">
                            <NumberInput
                              ariaLabel={`Target persentase termin ${t.nomor_termin}`}
                              allowDecimal
                              min={0}
                              max={100}
                              value={Number(t.target_persentase)}
                              onChange={(val) => handleTerminPercentChange(idx, val)}
                              className="bg-white pr-8 font-semibold"
                            />
                            <span className="pointer-events-none absolute right-3 text-xs font-bold text-[#1877F2]">
                              %
                            </span>
                          </div>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="mb-0.5 block text-[10px] text-gray-400 sm:hidden">
                            Nilai Tagihan (Rp)
                          </label>
                          <CurrencyInput
                            ariaLabel={`Nilai tagihan termin ${t.nomor_termin}`}
                            value={Number(t.nilai_tagihan)}
                            onChange={(val) => handleTerminNominalChange(idx, val)}
                            className="bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-0.5 block text-[10px] text-gray-400 sm:hidden">
                            Tenggat
                          </label>
                          <WheelDatePicker
                            ariaLabel={`Tenggat termin ${t.nomor_termin}`}
                            value={t.tenggat_waktu}
                            onChange={(val) => handleTerminDateChange(idx, val)}
                          />
                        </div>

                        <div className="text-right sm:col-span-1">
                          {terminList.length > 1 && (
                            <button
                              type="button"
                              aria-label={`Hapus termin ${t.nomor_termin}`}
                              onClick={() => handleRemoveTermin(idx)}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live status bar total % & selisih nominal */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                      isTagihanMatch && isDateRangeValid && areTerminDatesValid
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      {isTagihanMatch && isDateRangeValid && areTerminDatesValid ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Total tagihan termin tepat sama dengan nilai kontrak.</span>
                        </>
                      ) : !isTagihanMatch ? (
                        <>
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            Total tagihan ({formatRupiah(sumTagihan)}) selisih{' '}
                            {formatRupiah(Math.abs(diffTagihan))} dari nilai kontrak (
                            {formatRupiah(nilaiKontrak)}).
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            Pastikan seluruh tenggat termin berada dalam rentang tanggal kontrak.
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono font-bold">
                      Target Akhir: {maxTargetPct}% / 100%
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !isFormReady}
                    className="rounded-full bg-[#1877F2] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? 'Menyimpan…'
                      : editingId
                        ? 'Simpan Perubahan'
                        : 'Simpan Proyek'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* Modal Pantau Progres Fisik & Kendala Lapangan Proyek (2.1 / A4) */}
      {monitoringProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          onClick={() => setMonitoringProject(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#F8FAFC] shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Pemantauan Lapangan: {monitoringProject.kode_proyek} — {monitoringProject.nama_proyek}
                </h3>
                <p className="text-[11px] text-gray-500">{monitoringProject.dinas_pemberi_kerja}</p>
              </div>
              <div className="flex items-center gap-2.5">
                {monitoringEw && <EarlyWarningStatusBadge status={monitoringEw.status} />}
                <button
                  type="button"
                  aria-label="Tutup pemantauan proyek"
                  onClick={() => setMonitoringProject(null)}
                  className="rounded-full bg-slate-100 p-2 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <ProjectMonitoringPanel proyekId={monitoringProject.id_proyek} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
