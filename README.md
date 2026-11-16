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
</p>

---

## Navigasi Cepat

- [Tentang PANTERA](#-tentang-pantera)
- [Struktur Repository & Tech Stack](#-struktur-repository--tech-stack)
- [Persiapan Awal (Install Tools)](#-persiapan-awal-install-tools)
- [Cara Menjalankan dengan Docker (Direkomendasikan)](#-cara-menjalankan-dengan-docker-direkomendasikan)
- [Cara Menjalankan Tanpa Docker (Manual Lokal)](#-cara-menjalankan-tanpa-docker-manual-lokal)
- [Verifikasi & Testing](#-verifikasi--testing)
- [Perintah Harian Docker](#-perintah-harian-docker)
- [Troubleshooting (Jika Terjadi Error)](#-troubleshooting-jika-terjadi-error)

---

## 📖 Tentang PANTERA

**PANTERA** adalah sistem informasi monorepo untuk memantau dan mengendalikan aktivitas proyek konstruksi pada **PT. Djasipa Mitra Perkasa**. Aplikasi ini menghubungkan operasional di lapangan dengan manajemen kantor pusat—mencakup pengajuan material terhadap pagu RAB, pencatatan progres fisik & kendala, *early warning* keterlambatan termin, penagihan, serta pelacakan arsip fisik dan digital.

| Aktor | Peran Utama |
| :--- | :--- |
| **Direktur** | Registrasi proyek, kontrak, RAB, jadwal termin, dan persetujuan akhir material. |
| **Sekretaris / Keuangan** | Validasi pengajuan terhadap RAB & kas/kredit, pemantauan termin, dan penagihan ke dinas. |
| **Admin Lapangan** | Pengajuan material, input progres fisik & foto, laporan kendala, bukti termin, dan pencatatan arsip. |

---

## 🗂️ Struktur Repository & Tech Stack

```text
PANTERA/
├── backend/            # Laravel 13 REST API (PHP 8.3+, Sanctum, Pest)
│   ├── docker/         # Dockerfile backend (PHP 8.5 + Composer 2)
│   ├── routes/api.php  # Endpoint API (termasuk /api/health)
│   └── .env.example    # Template konfigurasi Laravel
├── frontend/           # React 19 + TypeScript + Vite 8 + Tailwind CSS v4
│   ├── Dockerfile      # Dockerfile frontend (Node 24 + npm 11)
│   └── vite.config.ts  # Konfigurasi dev server & proxy /api
├── compose.yaml        # Orkestrasi service db (MySQL 8.4), backend, frontend
├── .env.example        # Template port & kredensial MySQL untuk Docker Compose
└── README.md
```

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

### Langkah 4: Generate App Key & Migrasi Database

Setelah container `backend` selesai menginstal dependency:

```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate
```

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

Jalankan migrasi dan server backend:

```bash
php artisan migrate
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

Pastikan `frontend/vite.config.ts` mengarahkan proxy `/api` ke `http://127.0.0.1:8000`, lalu jalankan frontend:

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

---

## ✅ Verifikasi & Testing

Setelah menjalankan aplikasi (baik via Docker maupun Manual), pastikan koneksi Frontend ↔ Backend berjalan normal:

1. **Cek lewat Browser:** Buka [http://localhost:5173](http://localhost:5173). Halaman harus menampilkan **Koneksi Test** dengan JSON:
   ```json
   {
     "status": "success",
     "message": "PANTERA API is running"
   }
   ```
2. **Cek lewat Terminal (`curl`):**
   ```bash
   curl -i http://127.0.0.1:8000/api/health
   curl -i http://localhost:5173/api/health
   ```
   Pastikan header respons memuat `Content-Type: application/json` dan status `200 OK`.
3. **Menjalankan Automated Test Backend (Pest):**
   ```bash
   # Jika menggunakan Docker:
   docker compose exec backend php artisan test

   # Jika menggunakan Manual Lokal:
   php artisan test
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

---

<div align="center">
  <p><strong>PANTERA — Pemantauan Arsip, Termin, dan Risiko</strong></p>
  <p>PT. Djasipa Mitra Perkasa</p>
</div>