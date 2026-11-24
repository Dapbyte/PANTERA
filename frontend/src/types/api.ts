/**
 * PANTERA API TypeScript Type Definitions
 * Selaras 1:1 dengan Schema Database, Services, & Controllers Backend Laravel
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

export interface UserProjectAccessSummary {
  id_proyek: number;
  kode_proyek: string;
  nama_proyek: string;
}

export interface User {
  id_pengguna: number;
  nama: string;
  email: string;
  peran: UserRole;
  status_aktif: boolean;
  must_change_password?: boolean;
  lokasi_tugas: string | null;
  nomor_kontak: string | null;
  divisi: string | null;
  proyek_akses?: UserProjectAccessSummary[];
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
  nomor_kontak?: string | null;
  lokasi_tugas?: string | null;
  divisi?: string | null;
  password?: string;
}

export interface ChangePasswordPayload {
  current_password?: string;
  password: string;
  password_confirmation: string;
}

export interface CreateUserPayload {
  nama: string;
  email: string;
  password?: string;
  peran: UserRole;
  status_aktif?: boolean;
  lokasi_tugas?: string;
  nomor_kontak?: string;
  divisi?: string;
  project_ids?: number[];
}

export interface CreateUserResponseData extends User {
  temporary_password: string;
}

export interface UpdateUserPayload {
  nama?: string;
  email?: string;
  password?: string;
  peran?: UserRole;
  status_aktif?: boolean;
  lokasi_tugas?: string | null;
  nomor_kontak?: string | null;
  divisi?: string | null;
  project_ids?: number[];
}

// ==========================================
// 3. PROJECT MANAGEMENT & RAB
// ==========================================

export type ProjectStatus = 'Aktif' | 'Selesai' | 'Ditunda' | 'Dibatalkan' | string;

export type TerminStatus = 'Belum siap' | 'Siap serah' | 'Diajukan ke Dinas' | 'SP2D cair';

export interface DokumenTermin {
  id_dokumen: number;
  id_termin: number;
  jenis_dokumen: string;
  path_file: string;
  status_verifikasi: boolean;
  catatan_revisi: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Termin {
  id_termin: number;
  id_proyek: number;
  nomor_termin: number;
  target_persentase: number;
  nilai_tagihan: number | string;
  tenggat_waktu: string;
  status_penagihan: TerminStatus;
  estimasi_kerugian: number | string;
  tanggal_pengajuan: string | null;
  nomor_surat_serah: string | null;
  nomor_sp2d: string | null;
  tanggal_cair: string | null;
  catatan_koreksi_dinas: string | null;
  dokumen_termin?: DokumenTermin[];
  created_at?: string;
  updated_at?: string;
}

export interface Rab {
  id_rab: number;
  id_proyek: number;
  total_pagu: number | string;
  sisa_pagu: number | string;
  tanggal_ditetapkan: string;
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
  nilai_kontrak: number | string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_proyek: ProjectStatus;
  created_at?: string;
  updated_at?: string;

  // Relations
  pembuat?: User;
  rab?: Rab | null;
  termin?: Termin[];
  progres_fisik?: ProgresFisik[];
  admin_lapangan_akses?: Array<Pick<User, 'id_pengguna' | 'nama' | 'email'>>;
}

export interface ProjectListItem {
  id_proyek: number;
  kode_proyek: string;
  nama_proyek: string;
  dinas_pemberi_kerja: string;
  nilai_kontrak: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_proyek: ProjectStatus;
  ringkasan_rab: {
    total_pagu: number;
    sisa_pagu: number;
    versi_rab: string;
  };
  posisi_termin_berjalan: {
    id_termin: number;
    nomor_termin: number;
    target_persentase: number;
    nilai_tagihan: number;
    tenggat_waktu: string | null;
    status_penagihan: TerminStatus;
  } | null;
  progres_fisik_terakhir: {
    persentase_realisasi: number;
    tanggal_lapor: string | null;
  };
  admin_lapangan_ids?: number[];
  admin_lapangan?: Array<Pick<User, 'id_pengguna' | 'nama' | 'email'>>;
  created_at?: string | null;
}

export interface ProjectDetailResponse {
  proyek: Proyek;
  rekap_progres: {
    persentase_realisasi_terakhir: number;
    tanggal_lapor_terakhir: string | null;
    total_laporan_progres: number;
  };
  rekap_termin: {
    total_termin: number;
    termin_cair: number;
    termin_belum_cair: number;
    total_tagihan_cair: number;
    sisa_tagihan: number;
  };
}

export interface CreateTerminItemPayload {
  id_termin?: number;
  nomor_termin: number;
  target_persentase: number;
  nilai_tagihan: number;
  tenggat_waktu: string;
}

export interface StoreProyekPayload {
  kode_proyek?: string;
  nama_proyek: string;
  dinas_pemberi_kerja: string;
  nilai_kontrak: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_pagu: number;
  admin_lapangan_ids?: number[];
  termin: CreateTerminItemPayload[];
}

export interface UpdateProyekPayload {
  nama_proyek: string;
  dinas_pemberi_kerja: string;
  nilai_kontrak: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_proyek: ProjectStatus;
  total_pagu: number;
  admin_lapangan_ids?: number[];
  termin: CreateTerminItemPayload[];
}

export interface ProjectListFilters {
  q?: string;
  status_proyek?: ProjectStatus | string;
}

// ==========================================
// 4. HYBRID ARCHIVING MANAGEMENT
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
  tanggal_arsip: string;
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
  tanggal_arsip: string;
  tipe_penyimpanan: StorageType;
  file_dokumen?: File | null;
  nomor_binder?: string;
  nomor_rak?: string;
  ruang_simpan?: string;
  keterangan_posisi?: string;
  id_request?: number;
}

export interface UpdateArsipPayload {
  nomor_surat?: string;
  jenis_transaksi?: string;
  pihak_penyedia?: string;
  judul_dokumen?: string;
  jenis_arsip?: string;
  tanggal_arsip?: string;
  tipe_penyimpanan?: StorageType;
  nomor_binder?: string;
  nomor_rak?: string;
  ruang_simpan?: string;
  keterangan_posisi?: string | null;
}

export interface ArchiveSearchFilters {
  q?: string;
  jenis_arsip?: string;
  tipe_penyimpanan?: StorageType | string;
  id_proyek?: number;
  lokasi_fisik?: string;
  ruang_simpan?: string;
  nomor_rak?: string;
  nomor_binder?: string;
  sort?: 'terbaru' | 'terlama';
  per_page?: number | 'all';
  page?: number;
}

export interface ArchivePaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number | 'all';
  total: number;
}

export interface ArchivePaginatedResponse {
  items: ArsipDokumen[];
  meta: ArchivePaginationMeta;
}

export interface CreateArchiveResponseData {
  arsip: ArsipDokumen;
  label_stiker: string;
  koordinat_label: string;
}

export interface UpdateArchiveResponseData {
  arsip: ArsipDokumen;
  koordinat_label: string;
}

export interface ArchiveDetailResponseData extends ArsipDokumen {
  preview_url?: string | null;
  file_api_url?: string | null;
}

// ==========================================
// 5. MATERIAL PROCUREMENT & FINANCE WORKFLOW
// ==========================================

export type SifatPengajuan = 'Rutin' | 'Darurat';

export type StatusApprovalMaterial =
  | 'Diajukan'
  | 'Perlu Revisi'
  | 'Menunggu Direktur'
  | 'Selesai';

export type SkemaPembayaran = 'Kas' | 'Kredit';

export interface ItemMaterial {
  id_item: number;
  id_request: number;
  nama_material: string;
  volume: number;
  satuan: string;
  estimasi_harga: number | string | null;
  ketersediaan_vendor: boolean;
  vendor_nama: string | null;
  vendor_pengganti: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RiwayatRevisiMaterial {
  id_revisi: number;
  id_request: number;
  id_pengguna: number | null;
  peran: string;
  aksi: string;
  alasan: string | null;
  created_at: string;
  pengguna?: Pick<User, 'id_pengguna' | 'nama' | 'peran'> | null;
}

export interface TransaksiPembelian {
  id_transaksi: number;
  no_po: string;
  id_request: number;
  id_proyek: number;
  id_direktur: number;
  id_arsip_ref: number | null;
  tanggal_po: string;
  total_nominal?: number | string;
  status_po: 'Diterbitkan' | 'Diproses' | 'Selesai';
  catatan: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RequestMaterial {
  id_request: number;
  no_request: string;
  id_proyek: number;
  id_pengaju: number;
  id_validator: number | null;
  id_direktur: number | null;
  id_arsip_ref: number | null;
  tanggal_pengajuan: string;
  tanggal_butuh: string | null;
  sifat_pengajuan: SifatPengajuan;
  total_estimasi: number | string | null;
  status_approval: StatusApprovalMaterial;
  catatan_direktur: string | null;
  catatan_keuangan: string | null;
  catatan_lapangan: string | null;
  alasan_penolakan: string | null;
  melebihi_rab: boolean;
  skema_pembayaran: SkemaPembayaran | null;
  sisa_pagu_rab?: number | null;
  created_at?: string;
  updated_at?: string;

  // Relations
  proyek?: Proyek;
  pengaju?: User;
  validator?: User | null;
  direktur?: User | null;
  item_material?: ItemMaterial[];
  transaksi_pembelian?: TransaksiPembelian | null;
  arsip_dokumen?: ArsipDokumen | null;
  riwayat_revisi?: RiwayatRevisiMaterial[];
}

export interface MaterialListFilters {
  id_proyek?: number;
  status_approval?: StatusApprovalMaterial | string;
  sifat_pengajuan?: SifatPengajuan | string;
  q?: string;
}

export interface MaterialItemPayload {
  nama_material: string;
  volume: number;
  satuan: string;
}

export interface StoreMaterialPayload {
  id_proyek: number;
  sifat_pengajuan: SifatPengajuan;
  tanggal_butuh?: string;
  catatan_lapangan?: string;
  id_arsip_ref?: number;
  items: MaterialItemPayload[];
}

export interface UpdateMaterialPayload {
  sifat_pengajuan: SifatPengajuan;
  tanggal_butuh?: string;
  catatan_lapangan?: string;
  id_arsip_ref?: number;
  items: MaterialItemPayload[];
}

export interface FinanceItemReviewPayload {
  id_item: number;
  ketersediaan_vendor: boolean;
  vendor_nama?: string;
  vendor_pengganti?: string;
  harga_satuan: number;
}

export interface ValidateMaterialPayload {
  keputusan: 'Setuju' | 'Revisi';
  skema_pembayaran?: SkemaPembayaran;
  catatan_keuangan?: string;
  alasan_penolakan?: string;
  items?: FinanceItemReviewPayload[];
}

export interface ApproveMaterialPayload {
  keputusan: 'Disetujui' | 'Revisi';
  catatan_direktur?: string;
  alasan_penolakan?: string;
  id_arsip_ref?: number;
}

// ==========================================
// 6. FIELD PROGRESS, KENDALA & EARLY WARNING
// ==========================================

export type KategoriKendala = 'Cuaca' | 'Material' | 'Tenaga Kerja' | 'Peralatan' | 'Teknis';

export type TingkatKeparahan = 'Ringan' | 'Sedang' | 'Berat';

export type StatusPenangananKendala = 'Aktif' | 'Resolved';

export type EarlyWarningStatus = 'Aman' | 'Waspada' | 'Kritis';

export interface KendalaLapangan {
  id_kendala: number;
  id_progres: number;
  tanggal_kejadian: string;
  kategori_kendala: KategoriKendala;
  tingkat_keparahan: TingkatKeparahan;
  deskripsi_kendala: string;
  estimasi_hari_tertunda: number;
  status_penanganan: StatusPenangananKendala;
  tanggal_resolved: string | null;
  catatan_penyelesaian: string | null;
  path_foto: string | null;
  foto_paths?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgresFisik {
  id_progres: number;
  id_proyek: number;
  id_pelapor: number;
  tanggal_lapor: string;
  persentase_realisasi: number;
  deskripsi_pekerjaan: string;
  path_foto: string | null;
  foto_paths?: string[] | null;
  verifikasi_pengawas: boolean;
  pelapor?: Pick<User, 'id_pengguna' | 'nama'>;
  kendala_lapangan?: KendalaLapangan[];
  created_at?: string;
  updated_at?: string;
}

export interface MilestoneTercapai {
  id_termin: number;
  nomor_termin: number;
  target_persentase: number;
  status_penagihan: TerminStatus;
  pesan: string;
}

export interface EarlyWarningAnalysis {
  id_proyek: number;
  kode_proyek: string;
  nama_proyek: string;
  tanggal_evaluasi: string;
  status: EarlyWarningStatus;
  termin_berjalan: {
    id_termin: number;
    nomor_termin: number;
    target_persentase: number;
    nilai_tagihan: number;
    tenggat_waktu: string;
    status_penagihan: TerminStatus;
    hari_ke_tenggat: number;
  } | null;
  progres: {
    realisasi_terakhir: number;
    tanggal_lapor_terakhir: string | null;
    target_ekspektasi: number | null;
    deviasi_poin: number | null;
    gap_ke_target_termin: number | null;
    laju_per_hari: number | null;
  };
  prediksi: {
    hari_terlambat_progres: number;
    hari_terlambat_kendala: number;
    estimasi_hari_terlambat: number;
    estimasi_kerugian: number;
  };
  skor_kendala: number;
  kendala_aktif: Array<{
    id_kendala: number;
    kategori_kendala: KategoriKendala;
    tingkat_keparahan: TingkatKeparahan;
    deskripsi_kendala: string;
    estimasi_hari_tertunda: number;
    tanggal_kejadian: string | null;
    path_foto?: string | null;
    foto_paths?: string[];
  }>;
  faktor_penyebab: string[];
  kurva_s: {
    target: Array<{ tanggal: string; persentase: number }>;
    target_proyek?: Array<{ tanggal: string; persentase: number }>;
    realisasi: Array<{ tanggal: string | null; persentase: number }>;
  };
  rekomendasi?: {
    teks: string;
    sumber: 'rule' | 'llm' | string;
  };
}

export interface EarlyWarningPortfolioItem {
  id_proyek: number;
  kode_proyek: string;
  nama_proyek: string;
  status: EarlyWarningStatus;
  termin_berjalan: EarlyWarningAnalysis['termin_berjalan'];
  realisasi_terakhir: number;
  deviasi_poin: number | null;
  estimasi_hari_terlambat: number;
  estimasi_kerugian: number;
}

export interface EarlyWarningPortfolio {
  ringkasan: {
    total_proyek: number;
    proyek_berisiko: number;
    total_estimasi_kerugian: number;
  };
  proyek: EarlyWarningPortfolioItem[];
}

export interface StoreProgresPayload {
  tanggal_lapor?: string;
  persentase_realisasi: number;
  deskripsi_pekerjaan: string;
  foto?: File | null;
  fotos?: File[];
}

export interface StoreProgresResponseData {
  progres: ProgresFisik;
  milestone_tercapai: MilestoneTercapai[];
  early_warning: EarlyWarningAnalysis;
}

export interface StoreKendalaPayload {
  id_progres?: number;
  tanggal_kejadian?: string;
  kategori_kendala: KategoriKendala;
  tingkat_keparahan: TingkatKeparahan;
  deskripsi_kendala: string;
  estimasi_hari_tertunda: number;
  foto?: File | null;
  fotos?: File[];
}

export interface ResolveKendalaPayload {
  tanggal_resolved?: string;
  catatan_penyelesaian: string;
}

export interface KendalaMutationResponseData {
  kendala: KendalaLapangan;
  early_warning: EarlyWarningAnalysis;
}

// ==========================================
// 7. TERMIN CHECKLIST & BILLING
// ==========================================

export interface ChecklistRingkasan {
  total: number;
  diunggah: number;
  terverifikasi: number;
  persen: number;
  lengkap: boolean;
}

export interface TerminListItem {
  id_termin: number;
  nomor_termin: number;
  target_persentase: number;
  nilai_tagihan: number;
  tenggat_waktu: string | null;
  status_penagihan: TerminStatus;
  estimasi_kerugian: number;
  tanggal_pengajuan: string | null;
  nomor_surat_serah: string | null;
  nomor_sp2d: string | null;
  tanggal_cair: string | null;
  catatan_koreksi_dinas: string | null;
  checklist: ChecklistRingkasan;
}

export interface ChecklistDokumenItem {
  jenis_dokumen: string;
  label: string;
  diunggah: boolean;
  id_dokumen: number | null;
  path_file: string | null;
  url: string | null;
  file_api_url?: string | null;
  status_verifikasi: boolean;
  catatan_revisi: string | null;
}

export interface PeringatanBerkas {
  level: 'Waspada' | 'Kritis';
  hari_ke_tenggat: number;
  kerugian_per_hari: number;
  estimasi_hari_tertunda: number;
  estimasi_kerugian: number;
  pesan: string;
}

export interface TerminChecklistResponse {
  termin: {
    id_termin: number;
    id_proyek: number;
    nomor_termin: number;
    target_persentase: number;
    nilai_tagihan: number;
    tenggat_waktu: string | null;
    status_penagihan: TerminStatus;
    estimasi_kerugian: number;
    catatan_koreksi_dinas: string | null;
  };
  dokumen_wajib: ChecklistDokumenItem[];
  ringkasan: ChecklistRingkasan;
  peringatan: PeringatanBerkas | null;
}

export interface UploadDokumenTerminPayload {
  jenis_dokumen: string;
  file_dokumen: File;
}

export interface VerifikasiDokumenPayload {
  status_verifikasi: boolean;
  catatan_revisi?: string;
}

export interface DokumenTerminMutationResponse {
  dokumen: DokumenTermin;
  checklist: TerminChecklistResponse;
}

export interface AjukanTerminPayload {
  nomor_surat_serah: string;
  tanggal_pengajuan?: string;
}

export interface KoreksiTerminPayload {
  catatan_koreksi_dinas: string;
  dokumen?: Array<{
    id_dokumen: number;
    catatan_revisi: string;
  }>;
}

export interface CairkanTerminPayload {
  nomor_sp2d: string;
  tanggal_cair: string;
}

// ==========================================
// 8. BANK CREDIT COORDINATION & MITRA BANK
// ==========================================

export type StatusKoordinasiKredit = 'Diajukan' | 'Disetujui' | 'Ditolak';

export interface MitraBank {
  id_bank: number;
  nama_bank: string;
  kontak: string | null;
  catatan: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoreMitraBankPayload {
  nama_bank: string;
  kontak?: string;
  catatan?: string;
}

export interface FasilitasKredit {
  id_kredit: number;
  id_proyek: number;
  id_pencatat: number;
  nama_bank: string;
  nomor_fasilitas: string | null;
  plafon_kredit: number | string;
  suku_bunga: number | string | null;
  tenor_bulan: number;
  tanggal_koordinasi: string;
  tanggal_jatuh_tempo_baru: string | null;
  status_koordinasi: StatusKoordinasiKredit;
  catatan_kesepakatan: string | null;
  proyek?: Pick<Proyek, 'id_proyek' | 'kode_proyek' | 'nama_proyek' | 'dinas_pemberi_kerja' | 'nilai_kontrak'>;
  pencatat?: Pick<User, 'id_pengguna' | 'nama' | 'email' | 'peran'>;
  created_at?: string;
  updated_at?: string;
}

export interface StoreBankCreditPayload {
  id_proyek: number;
  nama_bank: string;
  nomor_fasilitas?: string;
  plafon_kredit: number;
  suku_bunga?: number;
  tenor_bulan: number;
  tanggal_koordinasi?: string;
  tanggal_jatuh_tempo_baru?: string;
  status_koordinasi?: StatusKoordinasiKredit;
  catatan_kesepakatan?: string;
}

export interface UpdateBankCreditPayload {
  nama_bank?: string;
  nomor_fasilitas?: string | null;
  plafon_kredit?: number;
  suku_bunga?: number | null;
  tenor_bulan?: number;
  tanggal_koordinasi?: string;
  tanggal_jatuh_tempo_baru?: string | null;
  status_koordinasi?: StatusKoordinasiKredit;
  catatan_kesepakatan?: string | null;
}

export interface BankCreditFilters {
  id_proyek?: number;
  status_koordinasi?: StatusKoordinasiKredit | string;
  q?: string;
}

export interface PerformanceReport {
  generated_at: string;
  proyek_detail: ProjectDetailResponse;
  early_warning: EarlyWarningAnalysis;
  riwayat_progres: ProgresFisik[];
  riwayat_kendala: KendalaLapangan[];
  fasilitas_kredit: FasilitasKredit[];
}

// ==========================================
// 9. NOTIFICATIONS & REALTIME SYNC
// ==========================================

export type NotificationModule =
  | 'beranda'
  | 'proyek'
  | 'termin'
  | 'kendala'
  | 'arsip'
  | 'contact'
  | 'users';

export interface NotificationSummary {
  badges: Record<NotificationModule, boolean>;
  counts: Record<NotificationModule, number>;
  sync_version: string;
}
