/**
 * PANTERA API TypeScript Type Definitions
 * Selaras 1:1 dengan Schema Database & Eloquent Models Backend Laravel 13
 */

// ==========================================
// 1. GENERIC API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export type ApiErrorResponse = ApiResponse<null | unknown>;

export interface ApiValidationError {
  status: 'error';
  message: string;
  errors: Record<string, string[]>;
}

// ==========================================
// 2. AUTHENTICATION & USER MANAGEMENT
// ==========================================

export type UserRole = 'Direktur' | 'SekretarisKeuangan' | 'AdminLapangan';

export interface User {
  id_pengguna: number;
  nama: string;
  email: string;
  peran: UserRole;
  status_aktif: boolean;
  lokasi_tugas: string | null;
  nomor_kontak: string | null;
  divisi: string | null;
  batas_verifikasi_kas: string | number | null;
  batas_approval_nominal: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  peran: UserRole;
  user: User;
}

export interface UpdateProfilePayload {
  nama?: string;
  nomor_kontak?: string;
  lokasi_tugas?: string;
  divisi?: string;
  password?: string;
}

export interface CreateUserPayload {
  nama: string;
  email: string;
  password: string;
  peran: UserRole;
  status_aktif?: boolean;
  lokasi_tugas?: string;
  nomor_kontak?: string;
  divisi?: string;
  batas_verifikasi_kas?: number;
  batas_approval_nominal?: number;
}

// ==========================================
// 3. PROJECT MANAGEMENT & RAB (UC-12 & SD-08)
// ==========================================

export type ProjectStatus = 'Perencanaan' | 'Sedang Berjalan' | 'Selesai' | 'Dibatalkan';

export type TerminStatus = 'Menunggu Tagihan' | 'Diajukan' | 'Cair' | 'Terlambat';

export interface DokumenTermin {
  id_dokumen_termin: number;
  id_termin: number;
  nama_file: string;
  path_dokumen: string;
  tipe_dokumen: string;
  created_at?: string;
  updated_at?: string;
}

export interface Termin {
  id_termin: number;
  id_proyek: number;
  nomor_termin: number;
  target_persentase: number;
  nilai_tagihan: number;
  tenggat_waktu: string; // Format: YYYY-MM-DD
  status_penagihan: TerminStatus;
  estimasi_kerugian: number | null;
  tanggal_pengajuan: string | null;
  nomor_surat_serah: string | null;
  nomor_sp2d: string | null;
  tanggal_cair: string | null;
  dokumen_termin?: DokumenTermin[];
  created_at?: string;
  updated_at?: string;
}

export interface Rab {
  id_rab: number;
  id_proyek: number;
  total_pagu: number;
  sisa_pagu: number;
  tanggal_ditetapkan: string; // Format: YYYY-MM-DD
  versi_rab: string;
  created_at?: string;
  updated_at?: string;
}

export interface Proyek {
  id_proyek: number;
  id_pembuat: number;
  kode_proyek: string;
  nama_proyek: string;
  dinas_pemberi_kerja: string;
  nilai_kontrak: number;
  tanggal_mulai: string; // Format: YYYY-MM-DD
  tanggal_selesai: string; // Format: YYYY-MM-DD
  status_proyek: ProjectStatus;
  created_at?: string;
  updated_at?: string;

  // Relations
  pembuat?: User;
  rab?: Rab;
  termin?: Termin[];
}

export interface CreateTerminItemPayload {
  nomor_termin: number;
  target_persentase: number;
  nilai_tagihan: number;
  tenggat_waktu: string; // Format: YYYY-MM-DD
}

export interface StoreProyekPayload {
  kode_proyek?: string;
  nama_proyek: string;
  dinas_pemberi_kerja: string;
  nilai_kontrak: number;
  tanggal_mulai: string; // Format: YYYY-MM-DD
  tanggal_selesai: string; // Format: YYYY-MM-DD
  total_pagu: number;
  termin: CreateTerminItemPayload[];
}

export interface ProjectListFilters {
  q?: string;
  status_proyek?: ProjectStatus | string;
}

// ==========================================
// 4. HYBRID ARCHIVING MANAGEMENT (UC-02, UC-11 & SD-07)
// ==========================================

export type StorageType = 'Fisik' | 'Digital' | 'Hibrida';

export interface LokasiArsipFisik {
  id_lokasi: number;
  id_arsip: number;
  nomor_binder: string;
  nomor_rak: string;
  ruang_simpan: string;
  keterangan_posisi: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ArsipDokumen {
  id_arsip: number;
  id_proyek: number;
  id_pencatat: number;
  nomor_surat: string;
  jenis_transaksi: string;
  pihak_penyedia: string;
  kode_arsip: string;
  judul_dokumen: string;
  jenis_arsip: string;
  tanggal_arsip: string; // Format: YYYY-MM-DD
  tipe_penyimpanan: StorageType;
  path_digital: string | null;
  created_at?: string;
  updated_at?: string;

  // Relations
  proyek?: Proyek;
  pencatat?: User;
  lokasi_arsip_fisik?: LokasiArsipFisik | null;
}

export interface StoreArsipPayload {
  id_proyek: number;
  nomor_surat: string;
  jenis_transaksi: string;
  pihak_penyedia: string;
  kode_arsip?: string;
  judul_dokumen: string;
  jenis_arsip: string;
  tanggal_arsip: string; // Format: YYYY-MM-DD
  tipe_penyimpanan: StorageType;

  // File upload opsional jika Digital / Hibrida
  file_dokumen?: File | null;

  // Koordinat fisik (wajib jika Fisik atau Hibrida)
  nomor_binder?: string;
  nomor_rak?: string;
  ruang_simpan?: string;
  keterangan_posisi?: string;

  // Referensi silang material opsional
  id_request?: number;
}

export interface ArchiveSearchFilters {
  q?: string;
  jenis_arsip?: string;
  tipe_penyimpanan?: StorageType | string;
  id_proyek?: number;
  ruang_simpan?: string;
  nomor_rak?: string;
  nomor_binder?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}

export interface CreateArchiveResponseData {
  arsip: ArsipDokumen;
  label_stiker: string;
  koordinat_label: string;
}

export interface ArchiveDetailResponseData extends ArsipDokumen {
  url_digital?: string | null;
  koordinat_lengkap?: string;
}
