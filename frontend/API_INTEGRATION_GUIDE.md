# 🚀 Panduan Integrasi API PANTERA untuk Tim Frontend

Dokumen ini adalah panduan lengkap bagi developer frontend untuk mengonsumsi REST API backend PANTERA secara langsung, aman, dan berstandar TypeScript penuh.

---

## 📁 1. Struktur Folder SDK / Services di Frontend

Seluruh kontrak data dan pemanggilan endpoint telah dibungkus rapi dalam modul TypeScript di dalam folder `src/`:

```text
frontend/src/
├── lib/
│   └── api.ts               # Axios client instance + Auth Interceptor + Token Helpers
├── types/
│   └── api.ts               # TypeScript interfaces & types lengkap (Model, Request, Response)
├── services/
│   ├── authService.ts       # Service login, logout, me, update profile
│   ├── projectService.ts    # Service katalog proyek, detail RAB, & pembuatan proyek (UC-12 / SD-08)
│   ├── archiveService.ts    # Service pencarian arsip multi-kriteria, detail, & upload hibrida (UC-02, UC-11, SD-07)
│   ├── userService.ts       # Service manajemen pengguna sistem (khusus Direktur)
│   └── index.ts             # Central export untuk import satu pintu
└── API_INTEGRATION_GUIDE.md # Panduan ini
```

---

## 🔑 2. Akun Pengujian (Seeded Accounts)

Gunakan akun berikut untuk menguji otorisasi berbasis peran (RBAC):

| Peran (`peran`) | Email | Password | Hak Akses Utama |
|---|---|---|---|
| **Direktur** | `direktur@pantera.id` | `password123` | Akses Penuh: Buat Proyek + RAB, Hapus Arsip, Kelola Pengguna |
| **SekretarisKeuangan** | `keuangan@pantera.id` | `password123` | Lihat Proyek, Catat & Cari Arsip, Termin |
| **AdminLapangan** | `lapangan@pantera.id` | `password123` | Lihat Proyek, Pelaporan Lapangan |

---

## 🌐 3. Format Respons API Terpadu

Backend PANTERA mengembalikan respons seragam berformat JSON:

### Respon Sukses (HTTP 200 / 201)
```json
{
  "status": "success",
  "message": "Operasi berhasil dijalankan.",
  "data": { ... }
}
```

### Respon Validasi Gagal (HTTP 422)
```json
{
  "status": "error",
  "message": "Validasi input gagal.",
  "errors": {
    "nilai_kontrak": ["Nilai kontrak harus lebih besar dari 0."],
    "termin": ["Total nilai tagihan seluruh termin harus tepat sama dengan nilai kontrak proyek."]
  }
}
```

### Respon Arsip Kosong (HTTP 404 - SD-07)
```json
{
  "status": "error",
  "message": "Arsip tidak ditemukan di repositori.",
  "data": null
}
```
*(Catatan: `archiveService.searchArchives()` otomatis menangkap 404 ini dan mengembalikan array kosong `[]` agar UI Anda tidak crash).*

---

## ⚡ 4. Quick Start & Contoh Pemakaian

Anda cukup mengimpor service dari `src/services`:

```typescript
import { authService, projectService, archiveService } from '@/services';
// Atau relative path:
// import { authService, projectService, archiveService } from '../services';
```

---

### A. Alur Autentikasi (Login & Logout)

```tsx
import React, { useState } from 'react';
import { authService, type User } from '@/services';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Token otomatis tersimpan di localStorage ('pantera_token')
      const { user, token } = await authService.login({ email, password });
      console.log('Login berhasil sebagai:', user.peran);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login gagal.');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && <div className="text-red-500">{errorMsg}</div>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">Masuk</button>
    </form>
  );
};
```

---

### B. Katalog & Pembuatan Proyek + RAB (UC-12 & SD-08)

#### 1. Mengambil Daftar Proyek:
```typescript
import { projectService } from '@/services';

// Ambil semua proyek atau filter berdasarkan status
const projects = await projectService.getProjects({
  q: 'Gedung',
  status_proyek: 'Sedang Berjalan'
});
```

#### 2. Membuat Proyek Baru beserta Termin (Aturan Bisnis Kritis SD-08):
> ⚠️ **Aturan Bisnis:** 
> - Total nilai tagihan seluruh termin **harus tepat sama** dengan `nilai_kontrak`.
> - `total_pagu` RAB tidak boleh melebihi `nilai_kontrak`.

```typescript
import { projectService, type StoreProyekPayload } from '@/services';

const payload: StoreProyekPayload = {
  nama_proyek: 'Pembangunan RSUD Tahap 2',
  dinas_pemberi_kerja: 'Dinas Kesehatan Prov. Kaltim',
  nilai_kontrak: 1000000000, // Rp 1.000.000.000
  tanggal_mulai: '2026-06-01',
  tanggal_selesai: '2026-12-31',
  total_pagu: 900000000,    // Rp 900.000.000 (RAB)
  termin: [
    {
      nomor_termin: 1,
      target_persentase: 30,
      nilai_tagihan: 300000000,
      tenggat_waktu: '2026-08-01',
    },
    {
      nomor_termin: 2,
      target_persentase: 70,
      nilai_tagihan: 700000000,
      tenggat_waktu: '2026-12-15',
    },
  ],
};

try {
  const newProject = await projectService.createProject(payload);
  console.log('Proyek berhasil dibuat:', newProject.kode_proyek);
} catch (err: any) {
  if (err.response?.status === 422) {
    console.error('Validasi gagal:', err.response.data.errors);
  }
}
```

---

### C. Manajemen Arsip Hibrida (UC-02, UC-11 & SD-07)

#### 1. Pencarian Multi-Kriteria (SD-07):
```typescript
import { archiveService } from '@/services';

// Mencari arsip (otomatis menangani 404 menjadi [])
const hasilPencarian = await archiveService.searchArchives({
  q: 'Semen',
  tipe_penyimpanan: 'Hibrida',
  ruang_simpan: 'Gedung A',
});

if (hasilPencarian.length === 0) {
  console.log('Tidak ada arsip yang cocok.');
}
```

#### 2. Input Arsip Baru dengan File & Koordinat Fisik (UC-11):
`archiveService.createArchive` otomatis menangani pengunggahan `FormData` secara transparan:

```typescript
import { archiveService } from '@/services';

const handleUploadArsip = async (fileDariInput: File) => {
  const result = await archiveService.createArchive({
    id_proyek: 1,
    nomor_surat: 'INV/2026/05/012',
    jenis_transaksi: 'Pengadaan Semen',
    pihak_penyedia: 'PT Semen Indonesia',
    judul_dokumen: 'Faktur Pengiriman Batch 1',
    jenis_arsip: 'Faktur Tagihan',
    tanggal_arsip: '2026-05-15',
    tipe_penyimpanan: 'Hibrida',
    file_dokumen: fileDariInput,
    ruang_simpan: 'Ruang Arsip Lt. 2',
    nomor_rak: 'Rak-04',
    nomor_binder: 'Binder-B-2026',
    keterangan_posisi: 'Baris ke-2 dari atas',
  });

  console.log('Arsip tersimpan dengan kode:', result.arsip.kode_arsip);
  console.log('Stiker Label Fisik:', result.label_stiker);
  console.log('Koordinat Fisik:', result.koordinat_label);
};
```

---

### D. Contoh Penggunaan dengan TanStack React Query

Frontend Anda telah memiliki `@tanstack/react-query`. Berikut adalah contoh implementasi idiomatik:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type ProjectListFilters } from '@/services';

export const useProjects = (filters?: ProjectListFilters) => {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectService.getProjects(filters),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      // Invalidate cache agar katalog proyek otomatis ter-refresh
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
```

---

## 📋 5. Ringkasan Endpoint Backend

| Method | Endpoint | Peran Akses | Keterangan |
|---|---|---|---|
| `POST` | `/api/auth/login` | Publik | Autentikasi akun & penerbitan Sanctum Token (SD-01) |
| `POST` | `/api/auth/logout` | Authenticated | Revoke token aktif saat ini |
| `GET` | `/api/auth/me` | Authenticated | Ambil profil pengguna login |
| `PUT` | `/api/auth/profile` | Authenticated | Perbarui data diri & kata sandi |
| `GET` | `/api/projects` | Semua Peran | Katalog daftar proyek dengan filter keyword & status |
| `GET` | `/api/projects/{id}` | Semua Peran | Detail proyek, rincian pagu RAB, & termin pembayaran |
| `POST` | `/api/projects` | `Direktur` | Buat proyek + pagu RAB + jadwal termin (UC-12 & SD-08) |
| `GET` | `/api/archive` | Semua Peran | Pencarian arsip multi-kriteria (UC-02 & SD-07) |
| `GET` | `/api/archive/{id}` | Semua Peran | Detail arsip, koordinat rak fisik, & URL file digital |
| `POST` | `/api/archive` | `Direktur`, `SekretarisKeuangan`, `AdminLapangan` | Catat arsip fisik/digital/hibrida + upload file (UC-11) |
| `DELETE` | `/api/archive/{id}` | `Direktur` | Hapus arsip dokumen |
| `GET` | `/api/users` | `Direktur` | Daftar seluruh pengguna terdaftar |
| `POST` | `/api/users` | `Direktur` | Pendaftaran pengguna baru |

---
*Dibuat oleh Tim Arsitektur Backend PANTERA untuk mempermudah dan mempercepat delivery tim Frontend.*
