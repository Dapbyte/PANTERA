# PANTERA Frontend

Antarmuka web untuk **PANTERA** (*Pemantauan Arsip, Termin, dan Risiko*) milik PT. Djasipa Mitra Perkasa—menyediakan dashboard dan alur kerja terintegrasi bagi **Direktur**, **Sekretaris / Keuangan**, serta **Admin Lapangan**.

## Tech Stack

- **Core:** React 19, TypeScript, Vite 8, Tailwind CSS v4
- **Routing & State:** React Router v8, TanStack Query v5 (sinkronisasi realtime & notifikasi badge)
- **Form, Chart & UI:** React Hook Form + Zod, Recharts (Kurva S & grafik risiko), Lucide React
- **PWA & Testing:** `vite-plugin-pwa`, Vitest + `@testing-library/react`

## Konfigurasi Environment & Proxy

Sesuaikan variabel berikut pada `frontend/.env` (atau lewat `compose.yaml` saat menjalankan via Docker):

| Variabel | Default | Keterangan |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api` | Base URL request API dari browser |
| `API_PROXY_TARGET` | `http://127.0.0.1:8000` | Target proxy Vite untuk `/api` dan `/storage` (di Docker: `http://backend:8000`) |
| `FRONTEND_PORT` | `5173` | Port dev server Vite |
| `VITE_USE_POLLING` | `false` | Set `true` di Docker Windows agar HMR tetap aktif via bind mount |

Konfigurasi pada `vite.config.ts` meneruskan endpoint `/api` dan berkas media `/storage` langsung ke server backend Laravel serta membundel manifest & service worker PWA.

## Perintah Pengembangan

Jalankan perintah berikut dari folder `frontend/` (atau via `docker compose exec frontend ...`):

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan dev server Vite dengan HMR |
| `npm run lint` | Menjalankan pengecekan ESLint di seluruh proyek |
| `npm test` | Menjalankan suite unit & component test Vitest |
| `npm run build` | Memeriksa tipe TypeScript (`tsc -b`) dan membangun bundle produksi + PWA |
| `npm run preview` | Menjalankan preview hasil build produksi secara lokal |

## Panduan Setup Lengkap

Untuk instruksi lengkap menjalankan keseluruhan aplikasi menggunakan Docker maupun secara manual (termasuk backend Laravel, migrasi database, *seeding*, `storage:link`, dan daftar akun login default), lihat **[README utama](../README.md)**.
