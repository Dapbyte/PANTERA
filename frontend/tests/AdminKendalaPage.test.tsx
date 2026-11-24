import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UiFeedbackProvider } from '../src/context/UiFeedbackContext';
import { AdminKendalaPage } from '../src/pages/admin/AdminKendalaPage';
import {
  kendalaService,
  projectService,
  type EarlyWarningAnalysis,
  type KendalaLapangan,
  type ProjectListItem,
} from '../src/services';

vi.mock('../src/services', async () => {
  const actual = await vi.importActual<typeof import('../src/services')>('../src/services');
  return {
    ...actual,
    projectService: {
      ...actual.projectService,
      getProjects: vi.fn(),
    },
    kendalaService: {
      ...actual.kendalaService,
      list: vi.fn(),
      create: vi.fn(),
    },
  };
});

describe('AdminKendalaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Offline in unit test'))
    );
  });

  it('submits exact "Tenaga Kerja" category, offers Kamera & Galeri photo inputs, and uses NumberInput', async () => {
    const mockProjects: ProjectListItem[] = [
      {
        id_proyek: 1,
        kode_proyek: 'P001',
        nama_proyek: 'Jembatan Uji',
        dinas_pemberi_kerja: 'Dinas PUPR',
        nilai_kontrak: 1000000000,
        tanggal_mulai: '2026-01-01',
        tanggal_selesai: '2026-12-31',
        status_proyek: 'Aktif',
        ringkasan_rab: { total_pagu: 900000000, sisa_pagu: 900000000, versi_rab: '1' },
        posisi_termin_berjalan: null,
        progres_fisik_terakhir: { persentase_realisasi: 10, tanggal_lapor: '2026-03-20' },
      },
    ];

    vi.mocked(projectService.getProjects).mockResolvedValueOnce(mockProjects);
    vi.mocked(kendalaService.list).mockResolvedValue([] as KendalaLapangan[]);
    vi.mocked(kendalaService.create).mockResolvedValueOnce({
      kendala: {
        id_kendala: 99,
        id_progres: 1,
        tanggal_kejadian: '2026-11-24',
        kategori_kendala: 'Tenaga Kerja',
        tingkat_keparahan: 'Berat',
        deskripsi_kendala: 'Kekurangan tukang las bersertifikat',
        estimasi_hari_tertunda: 4,
        status_penanganan: 'Aktif',
        tanggal_resolved: null,
        catatan_penyelesaian: null,
        path_foto: null,
      },
      early_warning: { status: 'Waspada' } as EarlyWarningAnalysis,
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={qc}>
        <UiFeedbackProvider>
          <AdminKendalaPage />
        </UiFeedbackProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tenaga Kerja' })).toBeInTheDocument();
    });

    // LAP-06: Pastikan 2 pilihan Ambil Foto (kamera) & Pilih Galeri tampil
    expect(screen.getByText('Ambil Foto')).toBeInTheDocument();
    expect(screen.getByText('Pilih Galeri')).toBeInTheDocument();
    const cameraInput = container.querySelector('input[capture="environment"]');
    expect(cameraInput).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Tenaga Kerja' }));
    fireEvent.click(screen.getByRole('button', { name: 'Berat' }));
    fireEvent.change(screen.getByPlaceholderText(/Jelaskan hambatan lapangan/i), {
      target: { value: 'Kekurangan tukang las bersertifikat' },
    });

    const estimasiInput = screen.getByLabelText('Estimasi hari terhenti');
    fireEvent.focus(estimasiInput);
    fireEvent.change(estimasiInput, { target: { value: '4' } });
    fireEvent.blur(estimasiInput);

    fireEvent.click(screen.getByRole('button', { name: /Kirim laporan/i }));

    await waitFor(() => {
      expect(kendalaService.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          kategori_kendala: 'Tenaga Kerja',
          tingkat_keparahan: 'Berat',
          deskripsi_kendala: 'Kekurangan tukang las bersertifikat',
          estimasi_hari_tertunda: 4,
        })
      );
    });
  });
});
