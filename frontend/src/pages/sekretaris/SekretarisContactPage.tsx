import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bankCreditService,
  mitraBankService,
  projectService,
  type FasilitasKredit,
  type MitraBank,
  type ProjectListItem,
  type StatusKoordinasiKredit,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { DownloadPerformanceReportButton } from '../../components/common/DownloadPerformanceReportButton';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import {
  CurrencyInput,
  CustomSelect,
  FieldError,
  NumberInput,
  SkeletonDashboard,
  WheelDatePicker,
} from '../../components/ui';
import {
  AlertCircle,
  Building2,
  Edit3,
  Landmark,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

export const SekretarisContactPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { confirm, showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: credits = [],
    isLoading: loadingCredits,
    error: errCredits,
  } = useQuery<FasilitasKredit[]>({
    queryKey: ['bank-credits', 'list'],
    queryFn: () => bankCreditService.list(),
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'keuangan-contact'],
    queryFn: () => projectService.getProjects(),
  });

  const { data: mitraBanks = [], isLoading: loadingBanks } = useQuery<MitraBank[]>({
    queryKey: ['mitra-bank', 'list'],
    queryFn: () => mitraBankService.list(),
  });

  // Create / Update coordination modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FasilitasKredit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const [idProyek, setIdProyek] = useState('');
  const [namaBank, setNamaBank] = useState('');
  const [nomorFasilitas, setNomorFasilitas] = useState('');
  const [plafonKredit, setPlafonKredit] = useState(250000000);
  const [sukuBunga, setSukuBunga] = useState(9.5);
  const [tenorBulan, setTenorBulan] = useState(12);
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('');
  const [statusKoordinasi, setStatusKoordinasi] = useState<StatusKoordinasiKredit>('Diajukan');
  const [catatan, setCatatan] = useState('');

  // Dynamic Mitra Bank Modal (KEU-07)
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<MitraBank | null>(null);
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankKontakInput, setBankKontakInput] = useState('');
  const [bankCatatanInput, setBankCatatanInput] = useState('');
  const [bankNameErr, setBankNameErr] = useState<string | null>(null);
  const [savingBank, setSavingBank] = useState(false);

  const effectiveProjectId = idProyek || (projects[0] ? String(projects[0].id_proyek) : '');

  const openNewModal = (bankPreset?: string) => {
    setEditingItem(null);
    setIdProyek(projects[0] ? String(projects[0].id_proyek) : '');
    setNamaBank(bankPreset || mitraBanks[0]?.nama_bank || 'Bank BNI');
    setNomorFasilitas('');
    setPlafonKredit(250000000);
    setSukuBunga(9.5);
    setTenorBulan(12);
    setTanggalJatuhTempo('');
    setStatusKoordinasi('Diajukan');
    setCatatan('');
    setModalError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: FasilitasKredit) => {
    setEditingItem(item);
    setIdProyek(String(item.id_proyek));
    setNamaBank(item.nama_bank);
    setNomorFasilitas(item.nomor_fasilitas || '');
    setPlafonKredit(Number(item.plafon_kredit) || 0);
    setSukuBunga(item.suku_bunga !== null ? Number(item.suku_bunga) : 0);
    setTenorBulan(Number(item.tenor_bulan) || 12);
    setTanggalJatuhTempo(item.tanggal_jatuh_tempo_baru || '');
    setStatusKoordinasi(item.status_koordinasi);
    setCatatan(item.catatan_kesepakatan || '');
    setModalError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string | undefined> = {};
    if (!editingItem && !effectiveProjectId) errs.proyek = 'Proyek wajib dipilih.';
    if (!namaBank.trim()) errs.namaBank = 'Nama bank mitra wajib diisi.';
    if (plafonKredit <= 0) errs.plafon = 'Plafon kredit harus lebih besar dari Rp 0.';
    if (tenorBulan <= 0) errs.tenor = 'Tenor minimal 1 bulan.';
    if (Object.values(errs).some(Boolean)) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingItem) {
        await bankCreditService.update(editingItem.id_kredit, {
          nama_bank: namaBank.trim(),
          nomor_fasilitas: nomorFasilitas.trim() || null,
          plafon_kredit: plafonKredit,
          suku_bunga: sukuBunga || null,
          tenor_bulan: tenorBulan,
          tanggal_jatuh_tempo_baru: tanggalJatuhTempo || null,
          status_koordinasi: statusKoordinasi,
          catatan_kesepakatan: catatan.trim() || null,
        });
        showToast({ type: 'success', message: 'Kesepakatan koordinasi bank berhasil diperbarui.' });
      } else {
        await bankCreditService.create({
          id_proyek: Number(effectiveProjectId),
          nama_bank: namaBank.trim(),
          nomor_fasilitas: nomorFasilitas.trim() || undefined,
          plafon_kredit: plafonKredit,
          suku_bunga: sukuBunga || undefined,
          tenor_bulan: tenorBulan,
          tanggal_jatuh_tempo_baru: tanggalJatuhTempo || undefined,
          status_koordinasi: statusKoordinasi,
          catatan_kesepakatan: catatan.trim() || undefined,
        });
        showToast({ type: 'success', message: 'Koordinasi fasilitas kredit bank berhasil dicatat.' });
      }
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['bank-credits'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setModalError(extractApiError(err, 'Gagal menyimpan data koordinasi kredit bank.'));
    } finally {
      setSubmitting(false);
    }
  };

  // KEU-07: Kelola Mitra Bank Dinamis
  const openBankModal = (bank?: MitraBank) => {
    setEditingBank(bank ?? null);
    setBankNameInput(bank?.nama_bank ?? '');
    setBankKontakInput(bank?.kontak ?? '');
    setBankCatatanInput(bank?.catatan ?? '');
    setBankNameErr(null);
    setIsBankModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameInput.trim()) {
      setBankNameErr('Nama bank mitra wajib diisi.');
      return;
    }
    setBankNameErr(null);
    setSavingBank(true);
    try {
      const payload = {
        nama_bank: bankNameInput.trim(),
        kontak: bankKontakInput.trim() || undefined,
        catatan: bankCatatanInput.trim() || undefined,
      };
      if (editingBank) {
        await mitraBankService.update(editingBank.id_bank, payload);
        showToast({ type: 'success', message: `Mitra ${bankNameInput.trim()} diperbarui.` });
      } else {
        await mitraBankService.create(payload);
        showToast({ type: 'success', message: `Mitra ${bankNameInput.trim()} ditambahkan.` });
      }
      setIsBankModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['mitra-bank'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setBankNameErr(extractApiError(err, 'Gagal menyimpan mitra bank.'));
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = async (bank: MitraBank) => {
    const ok = await confirm({
      title: 'Hapus Mitra Bank',
      message: `Yakin ingin menghapus ${bank.nama_bank} dari daftar mitra perbankan?`,
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await mitraBankService.destroy(bank.id_bank);
      showToast({ type: 'success', message: `Mitra ${bank.nama_bank} dihapus.` });
      await queryClient.invalidateQueries({ queryKey: ['mitra-bank'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      showToast({ type: 'error', message: extractApiError(err, 'Gagal menghapus mitra bank.') });
    }
  };

  const q = searchTerm.toLowerCase();
  const filteredCredits = credits.filter(
    (c) =>
      c.nama_bank.toLowerCase().includes(q) ||
      (c.proyek?.nama_proyek || '').toLowerCase().includes(q) ||
      (c.nomor_fasilitas || '').toLowerCase().includes(q)
  );
  const filteredProjects = projects.filter(
    (p) =>
      p.dinas_pemberi_kerja.toLowerCase().includes(q) || p.nama_proyek.toLowerCase().includes(q)
  );

  const loading = loadingCredits || loadingProjects || loadingBanks;
  const errorMsg = errCredits
    ? extractApiError(errCredits, 'Gagal memuat data koordinasi bank & dinas.')
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
            Koordinasi Kredit Bank &amp; Dinas
          </h1>
          <p className="text-xs text-gray-500">
            Pengelolaan mitra perbankan, fasilitas kredit konstruksi, dan direktori dinas pemberi kerja
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewModal()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1877F2] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Koordinasi Bank</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama bank, proyek, atau dinas..."
          className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 shadow-sm focus:border-[#1877F2] focus:outline-none"
        />
      </div>

      {loading ? (
        <SkeletonDashboard />
      ) : (
        <>
          {/* Mitra Bank Dinamis (KEU-07) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Mitra Perbankan Kredit Konstruksi
              </div>
              <button
                type="button"
                onClick={() => openBankModal()}
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#1877F2] hover:bg-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Mitra Bank</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {mitraBanks.map((bank) => (
                <div
                  key={bank.id_bank}
                  className="group relative flex flex-col items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex w-full justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${bank.nama_bank}`}
                      onClick={() => openBankModal(bank)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-blue-50 hover:text-[#1877F2]"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${bank.nama_bank}`}
                      onClick={() => void handleDeleteBank(bank)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openNewModal(bank.nama_bank)}
                    className="flex w-full flex-col items-center gap-1.5 rounded-xl pb-1"
                  >
                    <Landmark className="h-6 w-6 text-[#1877F2]" />
                    <span className="text-xs font-bold text-gray-800">{bank.nama_bank}</span>
                    {bank.kontak && (
                      <span className="text-[10px] text-gray-500">{bank.kontak}</span>
                    )}
                    <span className="text-[10px] font-medium text-[#1877F2] group-hover:underline">
                      Catat Koordinasi
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Riwayat Koordinasi Kredit Bank dengan badge/kolom rapi (KEU-06) */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Riwayat Koordinasi Fasilitas Kredit
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {filteredCredits.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Belum ada catatan koordinasi kredit bank.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase text-gray-400">
                        <th className="py-3 pl-5 pr-3">Bank &amp; No. Fasilitas</th>
                        <th className="py-3 px-3">Proyek</th>
                        <th className="py-3 px-3">Plafon Kredit</th>
                        <th className="py-3 px-3 text-center">Tenor &amp; Suku Bunga</th>
                        <th className="py-3 px-3">Jatuh Tempo Baru</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 pr-5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCredits.map((c) => (
                        <tr key={c.id_kredit} className="hover:bg-blue-50/40">
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="font-bold text-gray-900">{c.nama_bank}</div>
                            <div className="font-mono text-[10px] text-gray-400">
                              {c.nomor_fasilitas || 'Belum ada nomor'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-medium text-gray-900">
                              {c.proyek?.nama_proyek || `Proyek #${c.id_proyek}`}
                            </div>
                            <div className="font-mono text-[10px] text-gray-400">
                              {c.proyek?.kode_proyek}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                            {formatRupiah(c.plafon_kredit)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#1877F2]">
                                Tenor {c.tenor_bulan} bln
                              </span>
                              {c.suku_bunga !== null && (
                                <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                  Bunga {c.suku_bunga}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-gray-600">
                            {formatTanggal(c.tanggal_jatuh_tempo_baru)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                c.status_koordinasi === 'Disetujui'
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : c.status_koordinasi === 'Ditolak'
                                    ? 'border border-rose-200 bg-rose-50 text-rose-700'
                                    : 'border border-amber-200 bg-amber-50 text-amber-700'
                              }`}
                            >
                              {c.status_koordinasi}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 pr-5 text-center">
                            <button
                              type="button"
                              onClick={() => openEditModal(c)}
                              className="rounded-lg bg-[#1877F2] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-600"
                            >
                              Perbarui
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Dinas Pemberi Kerja + Ekspor Laporan Excel .xlsx (KEU-04 & KEU-05) */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Dinas Pemberi Kerja &amp; Ekspor Berkas Bank (.xlsx)
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((p) => (
                <div
                  key={p.id_proyek}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-xs shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{p.dinas_pemberi_kerja}</div>
                      <div className="text-[11px] text-gray-500">
                        {p.kode_proyek} — {p.nama_proyek}
                      </div>
                    </div>
                  </div>
                  <DownloadPerformanceReportButton
                    proyekId={p.id_proyek}
                    kodeProyek={p.kode_proyek}
                    label="Ekspor Laporan (.xlsx)"
                    filePrefix="performa"
                    variant="block"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal Tambah / Edit Koordinasi Kredit */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleSave}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-xs shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingItem ? 'Perbarui Koordinasi Kredit Bank' : 'Catat Koordinasi Kredit Bank'}
              </h3>
              <button
                type="button"
                aria-label="Tutup modal koordinasi"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                {modalError}
              </div>
            )}

            <div className="space-y-3">
              {!editingItem && (
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Proyek</label>
                  <CustomSelect
                    ariaLabel="Pilih Proyek"
                    searchable
                    hasError={Boolean(fieldErrors.proyek)}
                    value={effectiveProjectId}
                    onChange={(val) => {
                      setIdProyek(val);
                      setFieldErrors((p) => ({ ...p, proyek: undefined }));
                    }}
                    options={projects.map((p) => ({
                      value: String(p.id_proyek),
                      label: `${p.kode_proyek} — ${p.nama_proyek}`,
                    }))}
                  />
                  <FieldError message={fieldErrors.proyek} />
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Nama Bank Mitra</label>
                  {mitraBanks.length > 0 ? (
                    <CustomSelect
                      ariaLabel="Pilih Mitra Bank"
                      searchable
                      value={namaBank}
                      onChange={(val) => {
                        setNamaBank(val);
                        setFieldErrors((p) => ({ ...p, namaBank: undefined }));
                      }}
                      options={mitraBanks.map((b) => ({
                        value: b.nama_bank,
                        label: b.nama_bank,
                      }))}
                    />
                  ) : (
                    <input
                      type="text"
                      value={namaBank}
                      onChange={(e) => setNamaBank(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2"
                    />
                  )}
                  <FieldError message={fieldErrors.namaBank} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">No. Fasilitas</label>
                  <input
                    type="text"
                    value={nomorFasilitas}
                    onChange={(e) => setNomorFasilitas(e.target.value)}
                    placeholder="Opsional"
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Plafon (Rp)</label>
                  <CurrencyInput
                    ariaLabel="Plafon Kredit"
                    hasError={Boolean(fieldErrors.plafon)}
                    value={plafonKredit}
                    onChange={(val) => {
                      setPlafonKredit(val);
                      setFieldErrors((p) => ({ ...p, plafon: undefined }));
                    }}
                  />
                  <FieldError message={fieldErrors.plafon} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Tenor (bulan)</label>
                  <NumberInput
                    ariaLabel="Tenor Bulan"
                    min={1}
                    max={360}
                    hasError={Boolean(fieldErrors.tenor)}
                    value={tenorBulan}
                    onChange={(val) => {
                      setTenorBulan(val);
                      setFieldErrors((p) => ({ ...p, tenor: undefined }));
                    }}
                  />
                  <FieldError message={fieldErrors.tenor} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Bunga (%)</label>
                  <NumberInput
                    ariaLabel="Suku Bunga"
                    allowDecimal
                    min={0}
                    max={100}
                    value={sukuBunga}
                    onChange={(val) => setSukuBunga(val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">
                    Jatuh Tempo Baru
                  </label>
                  <WheelDatePicker
                    ariaLabel="Tanggal Jatuh Tempo Baru"
                    clearable
                    value={tanggalJatuhTempo}
                    onChange={(val) => setTanggalJatuhTempo(val)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Status</label>
                  <CustomSelect
                    ariaLabel="Status Koordinasi"
                    value={statusKoordinasi}
                    onChange={(val) => setStatusKoordinasi(val as StatusKoordinasiKredit)}
                    options={[
                      { value: 'Diajukan', label: 'Diajukan' },
                      { value: 'Disetujui', label: 'Disetujui' },
                      { value: 'Ditolak', label: 'Ditolak' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Catatan Kesepakatan Bank
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Ringkasan hasil negosiasi atau syarat tambahan dari bank..."
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#1877F2] px-5 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {submitting ? 'Menyimpan…' : 'Simpan Koordinasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Tambah / Edit Mitra Bank Dinamis (KEU-07) */}
      {isBankModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setIsBankModalOpen(false)}
        >
          <form
            onSubmit={handleSaveBank}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 text-xs shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingBank ? `Edit ${editingBank.nama_bank}` : 'Tambah Mitra Bank Baru'}
              </h3>
              <button
                type="button"
                aria-label="Tutup modal bank"
                onClick={() => setIsBankModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">Nama Bank Mitra</label>
                <input
                  type="text"
                  value={bankNameInput}
                  onChange={(e) => {
                    setBankNameInput(e.target.value);
                    setBankNameErr(null);
                  }}
                  placeholder="Misal: Bank Mandiri"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
                <FieldError message={bankNameErr} />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Kontak / Cabang (Opsional)
                </label>
                <input
                  type="text"
                  value={bankKontakInput}
                  onChange={(e) => setBankKontakInput(e.target.value)}
                  placeholder="Cabang / PIC / No. Telepon"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">Catatan</label>
                <textarea
                  rows={2}
                  value={bankCatatanInput}
                  onChange={(e) => setBankCatatanInput(e.target.value)}
                  placeholder="Catatan tambahan mitra perbankan..."
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 p-2.5 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingBank}
                className="rounded-full bg-[#1877F2] px-5 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {savingBank ? 'Menyimpan…' : 'Simpan Mitra Bank'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
