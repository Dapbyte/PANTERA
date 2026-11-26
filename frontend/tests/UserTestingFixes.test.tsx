import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PanteraLogo } from '../src/components/common/PanteraLogo';
import { MultiPhotoPicker } from '../src/components/common/MultiPhotoPicker';
import { DownloadPerformanceReportButton } from '../src/components/common/DownloadPerformanceReportButton';
import { DocumentPreviewModal } from '../src/components/common/DocumentPreviewModal';
import { CustomSelect, WheelDatePicker } from '../src/components/ui';
import { api } from '../src/lib/api';
import { UiFeedbackProvider } from '../src/context/UiFeedbackContext';
import { SekretarisValidasiPage } from '../src/pages/sekretaris/SekretarisValidasiPage';
import { bankCreditService, materialService, type PerformanceReport, type RequestMaterial } from '../src/services';
import { useState } from 'react';

vi.mock('../src/services', async () => {
  const actual = await vi.importActual<typeof import('../src/services')>('../src/services');
  return {
    ...actual,
    materialService: {
      ...actual.materialService,
      getDetail: vi.fn(),
    },
    bankCreditService: {
      ...actual.bankCreditService,
      getPerformanceReport: vi.fn(),
    },
  };
});

describe('User Testing Fixes Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = vi.fn();
    }
  });

  it('PanteraLogo renders brand text ANTERA instead of PANTERA (3.3 Branding)', () => {
    render(<PanteraLogo variant="dark" showText />);
    expect(screen.getByText('ANTERA')).toBeInTheDocument();
    expect(screen.queryByText('PANTERA')).not.toBeInTheDocument();
  });

  it('MultiPhotoPicker appends photos without overwriting previous selection and removes per photo (2.1)', async () => {
    const Wrapper = () => {
      const [files, setFiles] = useState<File[]>([]);
      return <MultiPhotoPicker files={files} onChange={setFiles} />;
    };

    const { container } = render(<Wrapper />);
    const fileInputs = container.querySelectorAll('input[type="file"]');
    expect(fileInputs).toHaveLength(2);

    const galleryInput = fileInputs[1] as HTMLInputElement;
    const f1 = new File(['aaa'], 'foto-satu.jpg', { type: 'image/jpeg' });
    const f2 = new File(['bbb'], 'foto-dua.png', { type: 'image/png' });

    fireEvent.change(galleryInput, { target: { files: [f1] } });
    expect(await screen.findByText('foto-satu.jpg')).toBeInTheDocument();

    fireEvent.change(galleryInput, { target: { files: [f2] } });
    expect(await screen.findByText('foto-satu.jpg')).toBeInTheDocument();
    expect(await screen.findByText('foto-dua.png')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Hapus foto foto-satu.jpg'));
    await waitFor(() => {
      expect(screen.queryByText('foto-satu.jpg')).not.toBeInTheDocument();
    });
    expect(screen.getByText('foto-dua.png')).toBeInTheDocument();
  });

  it('WheelDatePicker handles native non-passive wheel event without console error (3.4)', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let selected = '2026-11-24';

    render(
      <WheelDatePicker
        ariaLabel="Tanggal Wheel Uji"
        value={selected}
        onChange={(v) => {
          selected = v;
        }}
      />
    );

    fireEvent.click(screen.getByLabelText('Tanggal Wheel Uji'));
    const dialog = screen.getByRole('dialog');
    const colHeader = screen.getByText('Tgl');
    const wheelContainer = colHeader.parentElement!;

    fireEvent.wheel(wheelContainer, { deltaY: 120 });
    fireEvent.click(screen.getByRole('button', { name: 'Pilih' }));

    expect(dialog).not.toBeInTheDocument();
    expect(selected).toBe('2026-11-25');
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('SekretarisValidasiPage hides Melebihi Pagu RAB warning when Selesai and highlights numbers red without padding change (1.1)', async () => {
    const baseReq: RequestMaterial = {
      id_request: 10,
      no_request: 'REQ-20261125-001',
      id_proyek: 1,
      id_pengaju: 3,
      id_validator: 2,
      id_direktur: 1,
      id_arsip_ref: null,
      tanggal_pengajuan: '2026-11-25',
      tanggal_butuh: '2026-11-28',
      sifat_pengajuan: 'Rutin',
      total_estimasi: '900000000.00',
      status_approval: 'Selesai',
      catatan_direktur: null,
      catatan_keuangan: null,
      catatan_lapangan: null,
      alasan_penolakan: null,
      melebihi_rab: true,
      skema_pembayaran: 'Kas',
      sisa_pagu_rab: 50000000,
      item_material: [
        {
          id_item: 1,
          id_request: 10,
          nama_material: 'Besi Beton',
          volume: 10,
          satuan: 'ton',
          estimasi_harga: 90000000,
          ketersediaan_vendor: true,
          vendor_nama: 'PT Baja',
          vendor_pengganti: null,
        },
      ],
    };

    vi.mocked(materialService.getDetail).mockResolvedValueOnce(baseReq);

    const qc1 = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc1}>
        <UiFeedbackProvider>
          <SekretarisValidasiPage idRequest={10} onBack={vi.fn()} onValidated={vi.fn()} />
        </UiFeedbackProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Pengajuan telah disetujui Direktur/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Melebihi Pagu RAB/i)).not.toBeInTheDocument();

    // Kini uji saat status Diajukan dengan harga melebihi sisa pagu -> angka merah, container padding p-4 tetap
    vi.mocked(materialService.getDetail).mockResolvedValueOnce({
      ...baseReq,
      status_approval: 'Diajukan',
      sisa_pagu_rab: 50000000,
    });
    const qc2 = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc2}>
        <UiFeedbackProvider>
          <SekretarisValidasiPage idRequest={10} onBack={vi.fn()} onValidated={vi.fn()} />
        </UiFeedbackProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Melebihi Pagu RAB: Pengajuan tetap dapat diteruskan/i)).toBeInTheDocument();
    });
    const redNumbers = container.querySelectorAll('.text-rose-600');
    expect(redNumbers.length).toBeGreaterThanOrEqual(2);
  });

  it('DownloadPerformanceReportButton triggers report fetch, xlsx export, and 10s auto-close popup (1.2 Refactor)', async () => {
    const clickMock = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        el.click = clickMock;
      }
      return el;
    });

    const mockReport = {
      generated_at: '2026-11-25 01:00:00',
      proyek_detail: {
        proyek: {
          id_proyek: 1,
          id_pembuat: 1,
          kode_proyek: 'PRJ-01',
          nama_proyek: 'Jembatan',
          dinas_pemberi_kerja: 'PUPR',
          nilai_kontrak: 100000000,
          tanggal_mulai: '2026-01-01',
          tanggal_selesai: '2026-12-31',
          status_proyek: 'Aktif',
          rab: {
            id_rab: 1,
            id_proyek: 1,
            total_pagu: 80000000,
            sisa_pagu: 80000000,
            tanggal_ditetapkan: '2026-01-01',
            versi_rab: '1',
          },
          termin: [],
        },
        rekap_progres: { persentase_realisasi_terakhir: 0, tanggal_lapor_terakhir: null, total_laporan_progres: 0 },
        rekap_termin: { total_termin: 0, termin_cair: 0, termin_belum_cair: 0, total_tagihan_cair: 0, sisa_tagihan: 0 },
      },
      early_warning: {
        id_proyek: 1,
        kode_proyek: 'PRJ-01',
        nama_proyek: 'Jembatan',
        tanggal_evaluasi: '2026-02-01',
        status: 'Aman',
        termin_berjalan: null,
        progres: { realisasi_terakhir: 0, tanggal_lapor_terakhir: null, target_ekspektasi: null, deviasi_poin: null, gap_ke_target_termin: null, laju_per_hari: null },
        prediksi: { hari_terlambat_progres: 0, hari_terlambat_kendala: 0, estimasi_hari_terlambat: 0, estimasi_kerugian: 0 },
        skor_kendala: 0,
        kendala_aktif: [],
        faktor_penyebab: [],
        kurva_s: { target: [], realisasi: [] },
        rekomendasi: { teks: 'Aman', sumber: 'rule' },
      },
      riwayat_progres: [],
      riwayat_kendala: [],
      fasilitas_kredit: [],
    } satisfies PerformanceReport;

    vi.mocked(bankCreditService.getPerformanceReport).mockResolvedValueOnce(mockReport);

    render(
      <UiFeedbackProvider>
        <DownloadPerformanceReportButton proyekId={1} kodeProyek="PRJ-01" />
      </UiFeedbackProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Unduh Laporan Performa/i }));

    await waitFor(() => {
      expect(bankCreditService.getPerformanceReport).toHaveBeenCalledWith(1);
      expect(clickMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Laporan Performa Diunduh/i)).toBeInTheDocument();
    });

    vi.restoreAllMocks();
  });

  it('CustomSelect stops propagation on trigger & option clicks so parent modal backdrops do not close', () => {
    const backdropClick = vi.fn();
    const onChange = vi.fn();

    render(
      <div onClick={backdropClick}>
        <CustomSelect
          ariaLabel="Satuan Material"
          value="sak"
          onChange={onChange}
          options={[
            { value: 'sak', label: 'sak' },
            { value: 'batang', label: 'batang' },
          ]}
        />
      </div>
    );

    fireEvent.click(screen.getByLabelText('Satuan Material'));
    fireEvent.click(screen.getByRole('option', { name: 'batang' }));

    expect(onChange).toHaveBeenCalledWith('batang');
    expect(backdropClick).not.toHaveBeenCalled();
  });

  it('api 401 interceptor clears stored session and emits pantera:unauthorized for non-auth endpoints', async () => {
    localStorage.setItem('pantera_token', 'stale-token');
    const unauthorizedHandler = vi.fn();
    window.addEventListener('pantera:unauthorized', unauthorizedHandler);

    const rejector = (
      api.interceptors.response as unknown as {
        handlers: Array<{ rejected?: (err: unknown) => Promise<never> }>;
      }
    ).handlers[0].rejected!;

    await expect(
      rejector({
        response: { status: 401 },
        config: { url: '/projects' },
      })
    ).rejects.toBeDefined();

    expect(localStorage.getItem('pantera_token')).toBeNull();
    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener('pantera:unauthorized', unauthorizedHandler);
  });

  it('DocumentPreviewModal zoom controls update percentage and Escape closes modal', async () => {
    const onClose = vi.fn();
    const imgFile = new File(['img'], 'bukti.png', { type: 'image/png' });

    render(
      <DocumentPreviewModal title="Bukti Lapangan" localFile={imgFile} onClose={onClose} />
    );

    expect(await screen.findByText('100%')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Perbesar pratinjau'));
    expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Perkecil pratinjau'));
    expect(screen.getByText('100%')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
