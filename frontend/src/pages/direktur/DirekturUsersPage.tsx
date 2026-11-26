import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  projectService,
  userService,
  type CreateUserResponseData,
  type ProjectListItem,
  type User,
  type UserRole,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import {
  CustomCheckbox,
  CustomSelect,
  FieldError,
  SkeletonTable,
} from '../../components/ui';
import {
  Plus,
  X,
  AlertCircle,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react';

interface DirekturUsersPageProps {
  currentUserId: number;
}

export const DirekturUsersPage: React.FC<DirekturUsersPageProps> = ({ currentUserId }) => {
  const queryClient = useQueryClient();
  const { confirm, showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const {
    data: users = [],
    isLoading,
    error: queryError,
  } = useQuery<User[]>({
    queryKey: ['users', 'list'],
    queryFn: () => userService.getUsers(),
  });

  const { data: projects = [] } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'all-for-users'],
    queryFn: () => projectService.getProjects(),
  });

  // Add / Edit user modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [peran, setPeran] = useState<UserRole>('AdminLapangan');
  const [lokasiTugas, setLokasiTugas] = useState('');
  const [divisi, setDivisi] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ nama?: string; email?: string }>({});

  // Temp password credential modal (GLB-13)
  const [createdCredential, setCreatedCredential] = useState<CreateUserResponseData | null>(null);
  const [copiedCred, setCopiedCred] = useState(false);

  const openCreateModal = () => {
    setEditingUser(null);
    setNama('');
    setEmail('');
    setPeran('AdminLapangan');
    setLokasiTugas('');
    setDivisi('');
    setSelectedProjectIds([]);
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setNama(u.nama);
    setEmail(u.email);
    setPeran(u.peran);
    setLokasiTugas(u.lokasi_tugas || '');
    setDivisi(u.divisi || '');
    setSelectedProjectIds((u.proyek_akses ?? []).map((p) => p.id_proyek));
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleProjectAccess = (projectId: number) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleToggleStatus = async (user: User) => {
    const targetAction = user.status_aktif ? 'menonaktifkan' : 'mengaktifkan';
    const ok = await confirm({
      title: user.status_aktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun',
      message: `Yakin ingin ${targetAction} akun ${user.nama} (${user.email})?`,
      confirmLabel: user.status_aktif ? 'Nonaktifkan' : 'Aktifkan',
      variant: user.status_aktif ? 'danger' : 'primary',
    });
    if (!ok) return;

    try {
      await userService.updateUser(user.id_pengguna, {
        status_aktif: !user.status_aktif,
      });
      showToast({
        type: 'success',
        message: `Akun ${user.nama} berhasil di${user.status_aktif ? 'nonaktifkan' : 'aktifkan'}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: extractApiError(err, 'Gagal memperbarui status pengguna.'),
      });
    }
  };

  const handleDeleteUser = async (user: User) => {
    const ok = await confirm({
      title: 'Hapus Akun Pengguna',
      message: `Yakin ingin menghapus akun ${user.nama} (${user.email}) secara permanen?`,
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await userService.deleteUser(user.id_pengguna);
      showToast({ type: 'success', message: `Akun ${user.nama} berhasil dihapus.` });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        message: extractApiError(err, 'Gagal menghapus akun pengguna.'),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { nama?: string; email?: string } = {};
    if (!nama.trim()) errs.nama = 'Nama lengkap wajib diisi.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Masukkan alamat email yang valid.';
    }
    if (errs.nama || errs.email) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id_pengguna, {
          nama: nama.trim(),
          email: email.trim(),
          peran,
          divisi: divisi.trim() || null,
          lokasi_tugas: lokasiTugas.trim() || null,
          project_ids: peran === 'AdminLapangan' ? selectedProjectIds : [],
        });
        setIsModalOpen(false);
        showToast({ type: 'success', message: `Data pengguna ${nama.trim()} berhasil diperbarui.` });
      } else {
        const res = await userService.createUser({
          nama: nama.trim(),
          email: email.trim(),
          peran,
          lokasi_tugas: lokasiTugas.trim() || undefined,
          divisi: divisi.trim() || undefined,
          status_aktif: true,
          project_ids: peran === 'AdminLapangan' ? selectedProjectIds : [],
        });
        setIsModalOpen(false);
        setCopiedCred(false);
        setCreatedCredential(res);
      }

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setFormError(extractApiError(err, 'Gagal menyimpan data pengguna.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdCredential) return;
    const text = `Akun PANTERA\nNama: ${createdCredential.nama}\nEmail: ${createdCredential.email}\nPassword Sementara: ${createdCredential.temporary_password}\n(Harap segera ganti password saat login pertama)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCred(true);
      showToast({ type: 'success', message: 'Kredensial sementara disalin ke clipboard.' });
    } catch {
      showToast({ type: 'info', message: 'Silakan salin manual password sementara di modal.' });
    }
  };

  const roleLabel = (role: UserRole) =>
    role === 'Direktur'
      ? 'Direktur'
      : role === 'SekretarisKeuangan'
        ? 'Sekretaris & Keuangan'
        : 'Admin Lapangan';

  const errorMessage = queryError ? extractApiError(queryError, 'Gagal memuat daftar pengguna.') : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
            Manajemen Pengguna &amp; Akses Proyek
          </h1>
          <p className="text-xs text-gray-500">
            Kelola akun, peran pengguna, dan penugasan proyek Admin Lapangan
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1877F2] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="py-3 pl-6 pr-3">Nama &amp; Email</th>
                  <th className="py-3 px-3">Peran</th>
                  <th className="py-3 px-3">Divisi / Lokasi</th>
                  <th className="py-3 px-3">Akses Proyek</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 pr-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                {users.map((u) => (
                  <tr key={u.id_pengguna} className="transition hover:bg-blue-50/40">
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="font-semibold text-gray-900">{u.nama}</div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-[#1877F2]">{roleLabel(u.peran)}</td>
                    <td className="py-3.5 px-3 text-gray-600">
                      {u.divisi || u.lokasi_tugas || '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      {u.peran === 'AdminLapangan' ? (
                        u.proyek_akses && u.proyek_akses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.proyek_akses.map((p) => (
                              <span
                                key={p.id_proyek}
                                className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#1877F2]"
                              >
                                {p.kode_proyek}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium">
                            Belum diberi akses proyek
                          </span>
                        )
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                          Semua Proyek
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          u.status_aktif
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.status_aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 pr-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
                        >
                          <Edit3 className="h-3 w-3 text-[#1877F2]" />
                          <span>Edit</span>
                        </button>

                        {u.id_pengguna !== currentUserId ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white ${
                                u.status_aktif
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {u.status_aktif ? (
                                <>
                                  <UserX className="h-3 w-3" />
                                  <span>Nonaktifkan</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  <span>Aktifkan</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              aria-label={`Hapus akun ${u.nama}`}
                              onClick={() => void handleDeleteUser(u)}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-rose-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Hapus</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400">Akun Aktif</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Pengguna (GLB-13, GLB-14, DIR-07, DIR-09) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-xs shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingUser ? `Edit Pengguna — ${editingUser.nama}` : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                aria-label="Tutup form pengguna"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                {formError}
              </div>
            )}

            {!editingUser && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-[11px] text-blue-900">
                Password sementara acak akan dibuat otomatis oleh sistem dan pekerja wajib
                mengganti password saat login pertama.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value);
                    setFieldErrors((p) => ({ ...p, nama: undefined }));
                  }}
                  placeholder="Nama lengkap pekerja"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
                <FieldError message={fieldErrors.nama} />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">Email Perusahaan</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="nama@pantera.id"
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
                <FieldError message={fieldErrors.email} />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700">Peran</label>
                <CustomSelect
                  ariaLabel="Peran pengguna"
                  value={peran}
                  disabled={editingUser?.id_pengguna === currentUserId}
                  onChange={(val) => setPeran(val as UserRole)}
                  options={[
                    { value: 'AdminLapangan', label: 'Admin Lapangan' },
                    { value: 'SekretarisKeuangan', label: 'Sekretaris & Keuangan' },
                    { value: 'Direktur', label: 'Direktur' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value)}
                  placeholder="Divisi (opsional)"
                  className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  value={lokasiTugas}
                  onChange={(e) => setLokasiTugas(e.target.value)}
                  placeholder="Lokasi tugas (opsional)"
                  className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
              </div>

              {/* GLB-14: Akses proyek untuk Admin Lapangan */}
              {peran === 'AdminLapangan' && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2">
                  <div className="font-bold text-gray-800">
                    Hak Akses Proyek Admin Lapangan
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Admin Lapangan hanya dapat membuka proyek yang dicentang di bawah ini:
                  </p>
                  {projects.length === 0 ? (
                    <div className="text-[11px] text-gray-400">Belum ada proyek terdaftar.</div>
                  ) : (
                    <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto pr-1">
                      {projects.map((proj) => (
                        <CustomCheckbox
                          key={proj.id_proyek}
                          checked={selectedProjectIds.includes(proj.id_proyek)}
                          onChange={() => toggleProjectAccess(proj.id_proyek)}
                          className="w-full"
                          label={
                            <span className="break-words">
                              <strong className="font-mono text-[#1877F2]">
                                {proj.kode_proyek}
                              </strong>{' '}
                              — {proj.nama_proyek}
                            </span>
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
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
                {submitting
                  ? 'Menyimpan…'
                  : editingUser
                    ? 'Simpan Perubahan'
                    : 'Buat Akun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Ringkasan Kredensial Sementara (GLB-13) */}
      {createdCredential && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setCreatedCredential(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 text-xs shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Akun Pekerja Siap Digunakan</h3>
                <p className="text-[11px] text-gray-500">
                  Bagikan kredensial sementara ini sekali kepada pekerja.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama</span>
                <span className="font-bold text-gray-900">{createdCredential.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Peran</span>
                <span className="font-semibold text-[#1877F2]">
                  {roleLabel(createdCredential.peran)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email Login</span>
                <span className="font-mono font-semibold text-gray-900">
                  {createdCredential.email}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Password Sementara</span>
                <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-sm font-black text-gray-900 border border-gray-200">
                  {createdCredential.temporary_password}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCopyCredentials()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 py-2.5 font-semibold text-[#1877F2] hover:bg-blue-100"
              >
                {copiedCred ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCred ? 'Tersalin' : 'Salin Info Login'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredential(null)}
                className="flex-1 rounded-full bg-[#1877F2] py-2.5 font-semibold text-white hover:bg-blue-600"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
