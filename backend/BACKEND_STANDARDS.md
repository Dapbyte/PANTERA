# PANTERA BACKEND ARCHITECTURE & INTEGRATION STANDARDS
**Dokumen Panduan Arsitektur & Standar Integrasi API Backend**  
*Untuk: Anggota 2, Anggota 3, Anggota 4, dan Anggota 5*  
*Backend Lead / Technical Lead: Anggota 1*

---

## 1. Tech Stack & Environment
- **Framework:** Laravel 13 (PHP 8.3+)
- **Authentication:** Laravel Sanctum 4 (Bearer Token)
- **Database:** MySQL 8.4 (via Docker Compose `compose.yaml`)
- **Testing:** Pest PHP / PHPUnit
- **Code Standards:** Laravel Pint & PHPStan (Larastan)

---

## 2. Standar Respon API (`App\Traits\ApiResponse`)
Seluruh Controller diwajibkan menggunakan trait `App\Traits\ApiResponse`. Respon JSON yang dihasilkan harus selalu seragam:

### Format Sukses (HTTP 200 / 201)
```json
{
  "status": "success",
  "message": "Pesan deskriptif keberhasilan operasi",
  "data": { ... }
}
```
*Penggunaan:*
```php
use App\Traits\ApiResponse;

class ContohController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->successResponse($data, 'Data berhasil dimuat.');
    }

    public function store()
    {
        return $this->successResponse($newData, 'Data berhasil dibuat.', 201);
    }
}
```

### Format Gagal / Galat (HTTP 400 / 401 / 403 / 404 / 422)
```json
{
  "status": "error",
  "message": "Pesan deskripsi kesalahan",
  "errors": { ... }
}
```
*Penggunaan:*
```php
return $this->errorResponse('Pesan error', 404);
return $this->errorResponse('Validasi gagal', 422, $validator->errors());
```

---

## 3. Autentikasi & Role-Based Access Control (RBAC)

### Akun Seeder Default (`php artisan db:seed`)
| Peran | Nama | Email | Password | Wewenang Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Direktur** | Daniel Sipahutar | `direktur@pantera.id` | `password123` | Buat Proyek & RAB, Persetujuan Akhir Material, Kelola Pengguna |
| **SekretarisKeuangan** | Rita | `keuangan@pantera.id` | `password123` | Validasi Kas/Kredit Pengajuan Material, Monitoring Termin & Penagihan Dinas |
| **AdminLapangan** | Odd Dellarobia | `lapangan@pantera.id` | `password123` | Buat Pengajuan Material, Input Progres Fisik & Kendala, Catat Arsip |

### Penggunaan Middleware `role`
Daftarkan pembatasan peran pada file rute `routes/api.php`:
```php
// Khusus Direktur
Route::middleware(['auth:sanctum', 'role:Direktur'])->group(function () {
    Route::post('/projects/new', [ProjectController::class, 'store']);
});

// Multi-role (contoh: Direktur dan Keuangan)
Route::middleware(['auth:sanctum', 'role:Direktur,SekretarisKeuangan'])->group(function () {
    // ...
});
```
Jika peran tidak cocok atau `status_aktif == false`, sistem otomatis mengembalikan respon `403 Forbidden` terstandarisasi.

---

## 4. Skema Basis Data Bahasa Indonesia (11 Tabel Domain)

Sesuai Class Diagram Bab 4 `main.pdf`, seluruh nama tabel, primary key (`id_*`), foreign key, dan kolom menggunakan **Bahasa Indonesia**.

### A. Klaster Identitas & Proyek (Fondasi Bersama)
1. **Tabel `pengguna`** (Single Table Inheritance):
   - `id_pengguna` (PK, bigIncrements)
   - `nama`, `email` (unique), `password_hash`, `peran` (`AdminLapangan`, `SekretarisKeuangan`, `Direktur`), `status_aktif` (boolean)
   - Kolom spesifik peran: `lokasi_tugas`, `nomor_kontak`, `divisi`, `batas_verifikasi_kas`, `batas_approval_nominal`
2. **Tabel `proyek`**:
   - `id_proyek` (PK), `id_pembuat` (FK -> `pengguna.id_pengguna`)
   - `kode_proyek` (unique, misal `P001`), `nama_proyek`, `dinas_pemberi_kerja`, `nilai_kontrak` (decimal 18,2)
   - `tanggal_mulai` (date), `tanggal_selesai` (date), `status_proyek` (default `'Aktif'`)
3. **Tabel `rab`** (1-to-1 dengan `proyek`):
   - `id_rab` (PK), `id_proyek` (FK unique -> `proyek`, cascadeOnDelete)
   - `total_pagu` (decimal 18,2), `sisa_pagu` (decimal 18,2), `tanggal_ditetapkan` (date), `versi_rab` (default `'1'`)
4. **Tabel `termin`** (1-to-many dengan `proyek`):
   - `id_termin` (PK), `id_proyek` (FK -> `proyek`, cascadeOnDelete)
   - `nomor_termin` (int), `target_persentase` (double), `nilai_tagihan` (decimal 18,2), `tenggat_waktu` (date)
   - `status_penagihan` (`Belum siap`, `Siap serah`, `Diajukan ke Dinas`, `SP2D cair`)
   - `estimasi_kerugian` (decimal 18,2), `tanggal_pengajuan`, `nomor_surat_serah`, `nomor_sp2d`, `tanggal_cair`
5. **Tabel `dokumen_termin`**:
   - `id_dokumen` (PK), `id_termin` (FK -> `termin`, cascadeOnDelete)
   - `jenis_dokumen`, `path_file`, `status_verifikasi` (boolean), `catatan_revisi`

### B. Klaster Pengarsipan Hibrida (Anggota 1)
6. **Tabel `arsip_dokumen`**:
   - `id_arsip` (PK), `id_proyek` (FK -> `proyek`, cascadeOnDelete), `id_pencatat` (FK -> `pengguna`)
   - `nomor_surat`, `jenis_transaksi`, `pihak_penyedia`, `kode_arsip` (unique, misal `ARS-HBR-20261117-001`)
   - `judul_dokumen`, `jenis_arsip`, `tanggal_arsip`, `tipe_penyimpanan` (`Fisik`, `Digital`, `Hibrida`), `path_digital`
7. **Tabel `lokasi_arsip_fisik`** (1-to-0..1 dengan `arsip_dokumen`):
   - `id_lokasi` (PK), `id_arsip` (FK unique -> `arsip_dokumen`, cascadeOnDelete)
   - `nomor_binder`, `nomor_rak`, `ruang_simpan`, `keterangan_posisi`

### C. Klaster Material & Transaksi (Fondasi untuk Anggota 2)
8. **Tabel `request_material`**:
   - `id_request` (PK), `no_request` (unique, misal `REQ-001`)
   - `id_proyek` (FK -> `proyek`), `id_pengaju` (FK -> `pengguna`)
   - `id_validator` (FK nullable -> `pengguna`), `id_direktur` (FK nullable -> `pengguna`)
   - `id_arsip_ref` (FK nullable -> `arsip_dokumen`, referensi silang ke bukti arsip fisik)
   - `tanggal_pengajuan` (date), `sifat_pengajuan` (`Rutin`, `Darurat`), `total_estimasi` (decimal 18,2)
   - `status_approval` (`Pending`, `TervalidasiKeuangan`, `Disetujui`, `Revisi`)
   - `catatan_direktur` (text)
9. **Tabel `item_material`**:
   - `id_item` (PK), `id_request` (FK -> `request_material`, cascadeOnDelete)
   - `nama_material`, `volume` (double), `satuan`, `estimasi_harga` (decimal 18,2), `ketersediaan_vendor` (boolean)

### D. Klaster Progres & Kendala Lapangan (Fondasi untuk Anggota 3)
10. **Tabel `progres_fisik`**:
    - `id_progres` (PK), `id_proyek` (FK -> `proyek`), `id_pelapor` (FK -> `pengguna`)
    - `tanggal_lapor` (date), `persentase_realisasi` (double), `deskripsi_pekerjaan` (text), `path_foto`, `verifikasi_pengawas` (boolean)
11. **Tabel `kendala_lapangan`**:
    - `id_kendala` (PK), `id_progres` (FK -> `progres_fisik`, cascadeOnDelete)
    - `tanggal_kejadian` (date), `kategori_kendala`, `tingkat_keparahan`, `deskripsi_kendala`
    - `estimasi_hari_tertunda` (int), `status_penanganan`, `tanggal_resolved`, `catatan_penyelesaian`

---

## 5. Kontrak Endpoint API yang Disediakan Anggota 1

| Method | Endpoint | Hak Akses | Keterangan & Payload Kunci |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Publik | `{ "email": "...", "password": "..." }` -> Menghasilkan token Sanctum & profil |
| `POST` | `/api/auth/logout` | `auth:sanctum` | Cabut token aktif |
| `GET` | `/api/auth/me` | `auth:sanctum` | Ambil profil pengguna login |
| `PUT` | `/api/auth/profile` | `auth:sanctum` | Update profil & password |
| `GET` | `/api/users` | `role:Direktur` | Daftar seluruh pengguna sistem |
| `POST` | `/api/users` | `role:Direktur` | Tambah pengguna baru |
| `GET` | `/api/projects` | `auth:sanctum` | Katalog proyek (filter `?q=...&status_proyek=...`), ringkasan RAB, termin berjalan, progres terakhir |
| `GET` | `/api/projects/{id}` | `auth:sanctum` | Detail proyek, RAB, seluruh termin & dokumen termin, rekap finansial & progres |
| `POST` | `/api/projects/new` | `role:Direktur` | Buat proyek baru beserta RAB dan termin. Validasi kritis: total termin wajib sama dengan nilai kontrak |
| `GET` | `/api/archive/search` | `auth:sanctum` | Pencarian arsip multi-kriteria (`?q=...&jenis_arsip=...&tipe_penyimpanan=...`). Mengembalikan `404` jika tidak ada |
| `POST` | `/api/archive` | `auth:sanctum` | Catat arsip fisik/digital/hibrida, upload file, koordinat fisik, tautkan `id_request`, hasilkan stiker label |
| `GET` | `/api/archive/{id}` | `auth:sanctum` | Detail arsip, koordinat fisik, dan URL preview dokumen digital |
| `DELETE` | `/api/archive/{id}` | `auth:sanctum` | Hapus arsip dan koordinat fisiknya secara cascade |

---

## 6. Standar Kualitas & Testing Kode (Quality Assurance)
Sebelum melakukan commit dan push kode, setiap anggota tim **wajib** menjalankan 3 perintah verifikasi ini via Docker:

1. **Pemeriksaan Standar Kode (Laravel Pint):**
   ```bash
   docker compose exec backend ./vendor/bin/pint --test
   # Untuk memformat otomatis:
   docker compose exec backend ./vendor/bin/pint
   ```
2. **Analisis Statis Tipe Data (PHPStan / Larastan):**
   ```bash
   docker compose exec backend ./vendor/bin/phpstan analyse --memory-limit=512M
   ```
3. **Automated Feature & Unit Testing (Pest):**
   ```bash
   docker compose exec backend php artisan test
   ```
Seluruh pemeriksaan wajib berstatus **PASS / OK** tanpa error.
