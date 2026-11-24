<div align="center">
  <img src="https://i.ibb.co/rGXgMkw4/pantera.png" alt="Logo PANTERA" width="180" />
  <h1>PANTERA</h1>
  <p><strong>Aplikasi Pemantauan Arsip, Termin, dan Risiko</strong></p>
  <p>PT. Djasipa Mitra Perkasa</p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Development-blue?style=flat-square" alt="Project status: Development" />
  <img src="https://img.shields.io/badge/Architecture-Monorepo-6f42c1?style=flat-square" alt="Monorepo architecture" />
  <img src="https://img.shields.io/badge/Backend-Laravel%2013-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel 13 backend" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20TS-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React and TypeScript frontend" />
  <img src="https://img.shields.io/badge/Database-MySQL%208.4-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL 8.4 database" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA Ready" />
</p>

---

## Navigasi Cepat

- [Tentang PANTERA](#-tentang-pantera)
- [Fitur Utama](#-fitur-utama)
- [Struktur Repository & Tech Stack](#-struktur-repository--tech-stack)
- [Persiapan Awal (Install Tools)](#-persiapan-awal-install-tools)
- [Cara Menjalankan dengan Docker (Direkomendasikan)](#-cara-menjalankan-dengan-docker-direkomendasikan)
- [Cara Menjalankan Tanpa Docker (Manual Lokal)](#-cara-menjalankan-tanpa-docker-manual-lokal)
- [Akun Default (Seeder)](#-akun-default-seeder)
- [Verifikasi & Testing](#-verifikasi--testing)
- [Perintah Harian Docker](#-perintah-harian-docker)
- [Troubleshooting (Jika Terjadi Error)](#-troubleshooting-jika-terjadi-error)

---

## 📖 Tentang PANTERA

**PANTERA** adalah sistem informasi monorepo untuk memantau dan mengendalikan aktivitas proyek konstruksi pada **PT. Djasipa Mitra Perkasa**. Aplikasi ini menghubungkan operasional di lapangan dengan manajemen kantor pusat—mencakup alur pengajuan material 3 peran terhadap pagu RAB, pencatatan progres fisik & kendala multi-foto, *early warning* Kurva S & keterlambatan termin, verifikasi berkas & penagihan SP2D, fasilitas kredit bank, serta pelacakan arsip fisik dan digital.

| Aktor | Peran Utama |
| :--- | :--- |
| **Direktur** | Registrasi & ubah proyek, kontrak, pagu RAB, jadwal termin (auto-hitung `%`), atur penugasan proyek per Admin Lapangan, kelola akun pekerja (sandi sementara otomatis, wajib ganti sandi perdana, ubah peran, hapus), persetujuan akhir pengajuan material & PO (tanpa batas nominal), pemantauan progres/kendala/risiko, serta pengelolaan penuh arsip (termasuk hapus). |
| **Sekretaris / Keuangan** | Review pengajuan material dari lapangan (input ketersediaan vendor, vendor pengganti, harga satuan, skema Kas/Kredit), verifikasi 4 berkas checklist termin dengan pratinjau dokumen inline, pemantauan Kurva S & *Early Warning*, penagihan ke Dinas / koreksi / pencatatan SP2D, kelola fasilitas kredit & Mitra Bank dinamis, ekspor laporan performa `.xlsx`, serta pencatatan arsip. |
| **Admin Lapangan** | Akses proyek terbatas sesuai penugasan Direktur, pengajuan kebutuhan material (volume & satuan tanpa melihat/input nominal harga), input progres fisik & laporan kendala dengan multi-foto (kamera/galeri) serta prakiraan cuaca 7 hari, unggah 4 berkas checklist termin, dan pencatatan arsip (*append-only* & ubah lokasi fisik tanpa izin hapus). |

---

## ✨ Fitur Utama

- **Alur Pengajuan Material 3-Peran & Peringatan Over-RAB:** Admin Lapangan mengajukan item dan volume kebutuhan lapangan → Sekretaris/Keuangan melengkapi ketersediaan vendor, vendor pengganti, harga satuan, dan sumber dana (`Kas` / `Kredit`) dengan deteksi otomatis **Over-RAB** terhadap pagu → Direktur memberikan persetujuan akhir atau penolakan.
- **Progres Fisik, Kendala Multi-Foto & Prakiraan Cuaca:** Pencatatan progres kumulatif dan laporan kendala proyek dengan lampiran beberapa foto sekaligus (langsung dari kamera maupun galeri) serta informasi prakiraan cuaca 7 hari.
- **Checklist Termin, Verifikasi Berkas & Penagihan SP2D:** Pengunggahan 4 dokumen wajib termin oleh lapangan, pratinjau file inline dan verifikasi per berkas oleh Keuangan, hingga alur pengajuan tagihan ke Dinas, koreksi berkas, dan pencatatan pencairan SP2D.
- **Early Warning Kurva S, Kredit Bank & Ekspor `.xlsx`:** Pemantauan deviasi progres (Kurva S) dan risiko keterlambatan termin, pencatatan fasilitas kredit perbankan dengan daftar Mitra Bank yang dapat dikelola secara dinamis, serta ekspor laporan performa proyek ke format `.xlsx`.
- **Arsip Hibrida (Fisik & Digital) Bergaya Folder:** Organisasi arsip berbasis folder dan filter proyek, pratinjau dokumen PDF/gambar inline dengan zoom, pencatatan lokasi rak/ordner fisik, serta batasan hak akses per peran.
- **Realtime Sync, Notifikasi Badge & Dukungan PWA:** Sinkronisasi otomatis melalui TanStack Query, badge notifikasi lintas peran, kontrol akses berbasis peran (RBAC) + penugasan proyek, dan dukungan *Progressive Web App* (`vite-plugin-pwa`).

---

## 🗂️ Struktur Repository & Tech Stack

```text
PANTERA/
├── backend/                     # Laravel 13 REST API (PHP >= 8.3, Sanctum)
│   ├── docker/                  # Dockerfile backend (PHP 8.5 + Composer 2)
│   ├── database/seeders/        # DatabaseSeeder.php (3 akun default & 5 Mitra Bank)
│   ├── public/router.php        # Router static file /storage untuk PHP built-in server
│   ├── routes/api.php           # Endpoint API (auth, proyek, material, termin, arsip, /api/health)
│   ├── tests/                   # Automated tests (Pest 5 + Larastan/PHPStan + Pint)
│   └── .env.example             # Template konfigurasi Laravel
├── frontend/                    # React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + PWA
│   ├── Dockerfile               # Dockerfile frontend (Node 24 + npm 11)
│   ├── src/                     # Halaman per peran, komponen UI, React Query hooks, ekspor .xlsx
│   ├── tests/                   # Unit & component tests (Vitest + Testing Library)
│   └── vite.config.ts           # Konfigurasi dev server, plugin PWA, serta proxy /api & /storage
├── compose.yaml                 # Orkestrasi service db (MySQL 8.4), backend, frontend
├── .env.example                 # Template port & kredensial MySQL untuk Docker Compose
└── README.md
```

- **Backend:** Laravel 13 (`PHP >= 8.3`), Laravel Sanctum, Pest 5, Larastan (PHPStan), dan Laravel Pint.
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v8, TanStack Query v5, React Hook Form + Zod, Recharts, Lucide React, `vite-plugin-pwa`, dan Vitest.

---

## 🛠️ Persiapan Awal (Install Tools)

Pilih jalur setup yang ingin digunakan:

- **Jalur Docker (Direkomendasikan untuk tim):** Kamu **tidak perlu** menginstal PHP, Composer, MySQL, atau Node.js secara manual. Cukup instal **Git** dan **Docker Desktop**.
- **Jalur Manual (Tanpa Docker):** Instal **Git**, **PHP >= 8.3**, **Composer 2**, **Node.js >= 22**, dan **MySQL 8.x**.

<details>
<summary><strong>1. Panduan Install Git & Docker Desktop (Untuk Jalur Docker)</strong></summary>

1. **Install Git:**
   - **Windows:** Unduh dan instal dari [git-scm.com/downloads/win](https://git-scm.com/downloads/win) (atau via terminal: `winget install Git.Git`).
   - **macOS:** Jalankan `xcode-select --install` atau `brew install git`.
   - **Linux (Ubuntu/Debian):** `sudo apt update && sudo apt install -y git`.
2. **Install Docker Desktop:**
   - **Windows / macOS:** Unduh dari [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
   - Saat instalasi di **Windows**, biarkan opsi **WSL 2** tetap tercentang. Setelah selesai, buka aplikasi **Docker Desktop** dan tunggu hingga status di pojok kiri bawah bertuliskan **Engine running**.
   - **Linux:** Instal Docker Engine & Docker Compose plugin melalui [docs.docker.com/engine/install](https://docs.docker.com/engine/install/).
3. **Verifikasi di Terminal / PowerShell / CMD:**
   ```bash
   git --version
   docker --version
   docker compose version
   ```

</details>

<details>
<summary><strong>2. Panduan Install Runtime Manual (Hanya Jika Tidak Pakai Docker)</strong></summary>

1. **Git:** [git-scm.com](https://git-scm.com/downloads)
2. **PHP `>= 8.3` & Ekstensi:** Pastikan ekstensi `pdo_mysql`, `mbstring`, `bcmath`, `zip`, `openssl`, `tokenizer`, `ctype`, dan `fileinfo` aktif. Di Windows dapat menggunakan [Laragon](https://laragon.org/) atau [Laravel Herd](https://herd.laravel.com/).
3. **Composer 2:** Unduh dari [getcomposer.org](https://getcomposer.org/download/).
4. **Node.js `>= 22` (LTS):** Unduh dari [nodejs.org](https://nodejs.org/).
5. **MySQL 8.x:** Gunakan MySQL Server bawaan Laragon/XAMPP atau unduh dari [dev.mysql.com](https://dev.mysql.com/downloads/).

</details>

---

## 🐳 Cara Menjalankan dengan Docker (Direkomendasikan)

> [!IMPORTANT]
> Pastikan **Docker Desktop sudah terbuka dan berjalan** sebelum menjalankan perintah di bawah ini.

### Langkah 1: Clone Repository

```bash
git clone <REPOSITORY_URL>
cd PANTERA
```

### Langkah 2: Siapkan File Environment (`.env`)

File `backend/.env` **wajib ada** sebelum container dijalankan karena dibaca oleh `compose.yaml`.

**Windows (CMD):**
```cmd
copy .env.example .env
copy backend\.env.example backend\.env
```

**PowerShell / Git Bash / macOS / Linux:**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

> [!NOTE]
> Kamu tidak perlu mengubah isi `DB_HOST`, `DB_DATABASE`, atau `DB_PASSWORD` di `backend/.env` untuk mode Docker karena `compose.yaml` otomatis menyuntikkan konfigurasi database container (`db:3306`).

### Langkah 3: Build & Jalankan Semua Service

```bash
docker compose up -d --build
```

> [!TIP]
> **Proses pertama kali membutuhkan waktu 2–10 menit** (tergantung kecepatan internet) karena Docker akan mengunduh image MySQL/PHP/Node serta menjalankan `composer install` (131 paket) dan `npm ci`. Kamu bisa memantau progres instalasi backend dengan:
> ```bash
> docker compose logs -f backend
> ```
> Tunggu hingga muncul log `PHP 8.5.12 Development Server (http://0.0.0.0:8000) started` (tekan `Ctrl + C` untuk keluar dari tampilan log tanpa mematikan container).

### Langkah 4: Generate App Key, Storage Link, Migrasi & Seeder

Setelah container `backend` selesai menginstal dependency:

```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan storage:link
docker compose exec backend php artisan migrate --seed
```

> [!NOTE]
> Perintah `--seed` mengisi 3 akun awal aplikasi serta 5 Mitra Bank default. Untuk mereset database lokal ke kondisi awal yang bersih, jalankan `docker compose exec backend php artisan migrate:fresh --seed`.

### Langkah 5: Akses Aplikasi

| Layanan | URL / Akses | Keterangan |
| :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | Halaman utama React + Vite |
| **Backend API** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) | Endpoint cek kesehatan API |
| **MySQL (via Client GUI)** | `127.0.0.1` port `3307` | DB: `pantera`, User: `pantera`, Pass: `pantera_local_password_2026` |

---

## 💻 Cara Menjalankan Tanpa Docker (Manual Lokal)

Gunakan cara ini jika laptop tidak mendukung Docker Desktop.

### 1. Clone & Siapkan Backend

```bash
git clone <REPOSITORY_URL>
cd PANTERA/backend
composer install
```

Salin `.env.example` menjadi `.env` (`copy .env.example .env` di CMD atau `cp .env.example .env` di Bash/PowerShell), lalu generate key:

```bash
php artisan key:generate
```

Buat database baru di MySQL lokal bernama `pantera`, lalu ubah bagian database di `backend/.env`:

```env
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pantera
DB_USERNAME=root
DB_PASSWORD=
```

Buat *storage link*, jalankan migrasi beserta seeder, lalu nyalakan server backend:

```bash
php artisan storage:link
php artisan migrate --seed
php artisan serve
```

Backend akan berjalan di `http://127.0.0.1:8000`.

### 2. Siapkan & Jalankan Frontend

Buka **terminal baru**, masuk ke folder `frontend/`:

```bash
cd PANTERA/frontend
npm ci
```

Buat file `frontend/.env` dan isi dengan:

```env
VITE_API_BASE_URL=/api
```

Pastikan `frontend/vite.config.ts` mengarahkan proxy `/api` dan `/storage` ke `http://127.0.0.1:8000`, lalu jalankan frontend:

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

---

## 🔑 Akun Default (Seeder)

Menjalankan `php artisan migrate --seed` akan mengisi akun demo awal dari `backend/database/seeders/DatabaseSeeder.php`:

| Peran | Nama | Email | Password Default |
| :--- | :--- | :--- | :--- |
| **Direktur** | Daniel Sipahutar | `direktur@pantera.id` | `password123` |
| **Sekretaris / Keuangan** | Rita | `keuangan@pantera.id` | `password123` |
| **Admin Lapangan** | Odd Dellarobia | `lapangan@pantera.id` | `password123` |

Selain akun pengguna, `DatabaseSeeder` juga mengisi 5 **Mitra Bank** default untuk fasilitas kredit konstruksi: `Bank BNI`, `Bank BCA`, `Bank BRI`, `Bank BTN`, dan `Bank Jatim`.

---

## ✅ Verifikasi & Testing

Setelah menjalankan aplikasi (baik via Docker maupun Manual), lakukan verifikasi koneksi serta pengujian otomatis:

1. **Cek lewat Browser:** Buka [http://localhost:5173](http://localhost:5173). Pastikan halaman **Login PANTERA** tampil tanpa error di Console/Network, lalu coba masuk menggunakan salah satu akun default di atas (misalnya `direktur@pantera.id` / `password123`) untuk mengakses dashboard sesuai peran.
2. **Cek lewat Terminal (`curl`):**
   ```bash
   curl -i http://127.0.0.1:8000/api/health
   curl -i http://localhost:5173/api/health
   ```
   Pastikan header respons memuat `Content-Type: application/json`, status `200 OK`, dan payload `{"status":"success","message":"PANTERA API is running"}`.
3. **Automated Test & CI Backend (Pint, PHPStan & Pest):**
   ```bash
   # Menjalankan pengecekan lengkap CI (Pint --test, Larastan/PHPStan, dan Pest — 98 tests):
   # Jika menggunakan Docker:
   docker compose exec backend composer ci:check
   # Jika menggunakan Manual Lokal (dari folder backend/):
   composer ci:check

   # Atau hanya menjalankan suite test Pest:
   docker compose exec backend php artisan test
   # Manual Lokal:
   php artisan test
   ```
4. **Lint, Unit Test & Production Build Frontend (ESLint, Vitest & Vite PWA):**
   ```bash
   # Jika menggunakan Docker:
   docker compose exec frontend npm run lint
   docker compose exec frontend npm test
   docker compose exec frontend npm run build

   # Jika menggunakan Manual Lokal (dari folder frontend/):
   npm run lint    # ESLint
   npm test        # Vitest (6 file / 18 tests)
   npm run build   # Pengecekan TypeScript (tsc -b) + production & PWA build
   ```

---

## 🧰 Perintah Harian Docker

| Kebutuhan | Perintah |
| :--- | :--- |
| Menyalakan semua container | `docker compose up -d` |
| Mematikan semua container | `docker compose down` |
| Melihat status container | `docker compose ps` |
| Melihat log backend secara *real-time* | `docker compose logs -f backend` |
| Restart frontend (misal proxy belum nyambung) | `docker compose restart frontend` |
| Menjalankan perintah `artisan` | `docker compose exec backend php artisan <perintah>` |
| Reset total termasuk database & volume | `docker compose down -v` |

> [!NOTE]
> **Kapan perlu rebuild?** Perubahan kode di dalam folder `backend/` atau `frontend/` otomatis terbaca tanpa perlu rebuild. Rebuild (`docker compose up -d --build`) hanya diperlukan jika ada perubahan pada `compose.yaml`, `Dockerfile`, `composer.json`, atau `package.json`.

---

## 🚨 Troubleshooting (Jika Terjadi Error)

Klik gejala error yang muncul di bawah ini untuk melihat penyebab dan solusinya.

<details>
<summary><strong>1. Error: <code>env file .../backend/.env not found</code> saat menjalankan Docker</strong></summary>

- **Penyebab:** File `backend/.env` belum dibuat.
- **Solusi:** Salin template environment terlebih dahulu:
  ```bash
  cp backend/.env.example backend/.env
  ```
  Lalu jalankan ulang `docker compose up -d`.

</details>

<details>
<summary><strong>2. Download Composer sangat lama atau gagal <code>curl error 28 (SSL connection timeout)</code></strong></summary>

- **Penyebab:** Koneksi internet lambat atau timeout saat mengunduh zip paket dari `codeload.github.com` ketika `composer install` berjalan di dalam container.
- **Solusi:**
  1. Hentikan container backend terlebih dahulu agar tidak bentrok:
     ```bash
     docker compose stop backend
     ```
  2. Jalankan instalasi manual dengan timeout tanpa batas dan koneksi paralel dikurangi:
     ```bash
     docker compose run --rm -e COMPOSER_PROCESS_TIMEOUT=0 -e COMPOSER_MAX_PARALLEL_HTTP=2 backend composer install --no-interaction --prefer-dist
     ```
     *(Jika masih sering timeout dan hanya ingin menjalankan API, tambahkan flag `--no-dev` di akhir perintah).*
  3. Jika tetap gagal, coba **ganti jaringan ke hotspot HP**, jalankan `wsl --shutdown` lalu buka ulang Docker Desktop, atau tambahkan DNS publik di **Docker Desktop → Settings → Docker Engine**:
     ```json
     "dns": ["8.8.8.8", "1.1.1.1"]
     ```
  4. Setelah selesai (`Generating optimized autoload files`), nyalakan kembali semua service:
     ```bash
     docker compose up -d
     ```

</details>

<details>
<summary><strong>3. Browser menampilkan <code>502 Bad Gateway</code> di <code>localhost:5173</code></strong></summary>

- **Penyebab:** Container `frontend` sudah berjalan, tetapi container `backend` masih dalam proses `composer install` atau belum siap menerima koneksi.
- **Solusi:**
  1. Cek status dan log backend:
     ```bash
     docker compose ps
     docker compose logs --tail=30 backend
     ```
  2. Jika log backend sudah menunjukkan server berjalan (`Development Server started`), restart container frontend agar Vite proxy tersambung ulang:
     ```bash
     docker compose restart frontend
     ```

</details>

<details>
<summary><strong>4. API status <code>200 OK</code> tapi frontend error <code>Response bukan JSON: "\n"</code></strong></summary>

- **Penyebab:** Terdapat baris kosong (`\n`) atau karakter tersembunyi (BOM) sebelum tag `<?php` pada salah satu file PHP (misalnya `backend/routes/api.php`), sehingga header HTTP `text/html` terkirim lebih dulu sebelum JSON Laravel.
- **Solusi:**
  1. Buka file yang baru diubah (cek `routes/api.php`, `bootstrap/app.php`, `public/index.php`) dan pastikan `<?php` berada tepat di **baris 1 kolom 1**.
  2. Untuk mengecek seluruh file PHP secara cepat lewat Docker:
     ```bash
     docker compose exec backend sh -c "for f in \$(find app routes config bootstrap database -name '*.php'); do head -c1 \$f | od -An -tx1 | grep -q '0a' && echo \$f; done"
     ```
     Hapus baris kosong di awal setiap file yang tercetak.

</details>

<details>
<summary><strong>5. Error <code>port is already allocated</code> (Port 3307, 8000, atau 5173 sudah dipakai)</strong></summary>

- **Penyebab:** Ada aplikasi lain (misalnya XAMPP, Laragon, MySQL lokal, atau proyek Vite/Laravel lain) yang sedang memakai port yang sama.
- **Solusi:** Matikan aplikasi yang bentrok, atau ubah port di file `.env` pada root folder `PANTERA/`:
  ```env
  MYSQL_PORT=3308
  BACKEND_PORT=8001
  FRONTEND_PORT=5174
  ```
  Lalu jalankan ulang `docker compose up -d`.

</details>

<details>
<summary><strong>6. Foto progres/kendala atau file arsip tidak tampil (<code>404</code> pada <code>/storage/...</code>)</strong></summary>

- **Penyebab:** Symlink `backend/public/storage` belum dibuat, PHP built-in server dijalankan tanpa `public/router.php`, atau proxy `/storage` di frontend belum aktif.
- **Solusi:**
  1. Pastikan *storage link* sudah dibuat:
     ```bash
     # Jika menggunakan Docker:
     docker compose exec backend php artisan storage:link

     # Jika menggunakan Manual Lokal (di folder backend/):
     php artisan storage:link
     ```
  2. Pastikan `compose.yaml` menjalankan PHP built-in server dengan router script:
     ```text
     php -S 0.0.0.0:8000 -t public public/router.php
     ```
     *(Untuk Manual Lokal, `php artisan serve` otomatis menangani file publik di `public/`).*
  3. Pastikan `frontend/vite.config.ts` sudah mem-proxy baik `/api` maupun `/storage` ke target backend (`http://127.0.0.1:8000` di lokal atau `http://backend:8000` di Docker).

</details>

---

<div align="center">
  <p><strong>PANTERA — Pemantauan Arsip, Termin, dan Risiko</strong></p>
  <p>PT. Djasipa Mitra Perkasa</p>
</div>