import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyInput, NumberInput, WheelDatePicker } from '../src/components/ui';
import { buildPerformanceReportXlsx } from '../src/lib/xlsxExport';
import type { PerformanceReport } from '../src/types/api';

describe('UI Kit & XLSX Export', () => {
  it('CurrencyInput formats thousands with dot and handles 0 replacement smoothly (DIR-04 & LAP-02)', () => {
    let latest = 0;
    const { rerender } = render(
      <CurrencyInput
        ariaLabel="Nominal Uji"
        value={latest}
        onChange={(v) => {
          latest = v;
        }}
      />
    );

    const input = screen.getByLabelText('Nominal Uji') as HTMLInputElement;
    expect(input.value).toBe('0');

    fireEvent.change(input, { target: { value: '1500000' } });
    expect(latest).toBe(1500000);

    rerender(
      <CurrencyInput
        ariaLabel="Nominal Uji"
        value={latest}
        onChange={(v) => {
          latest = v;
        }}
      />
    );
    expect(input.value).toBe('1.500.000');

    fireEvent.change(input, { target: { value: '' } });
    expect(latest).toBe(0);
  });

  it('NumberInput replaces leading 0 when typing and falls back to 0 when cleared', () => {
    let latest = 0;
    const { rerender } = render(
      <NumberInput
        ariaLabel="Angka Uji"
        value={latest}
        onChange={(v) => {
          latest = v;
        }}
      />
    );

    const input = screen.getByLabelText('Angka Uji') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '07' } });
    expect(latest).toBe(7);

    fireEvent.change(input, { target: { value: '' } });
    expect(latest).toBe(0);
    fireEvent.blur(input);

    rerender(
      <NumberInput
        ariaLabel="Angka Uji"
        value={latest}
        onChange={(v) => {
          latest = v;
        }}
      />
    );
    expect(input.value).toBe('0');
  });

  it('WheelDatePicker opens dialog, changes day/month via wheel controls, and outputs YYYY-MM-DD (GLB-06)', () => {
    let selected = '2026-11-24';
    render(
      <WheelDatePicker
        ariaLabel="Tanggal Uji"
        value={selected}
        onChange={(v) => {
          selected = v;
        }}
      />
    );

    fireEvent.click(screen.getByLabelText('Tanggal Uji'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Tambah Tgl'));
    fireEvent.click(screen.getByRole('button', { name: 'Pilih' }));

    expect(selected).toBe('2026-11-25');
  });

  it('buildPerformanceReportXlsx builds a valid OOXML .xlsx zip blob with 3 sheets (KEU-05)', async () => {
    const report: PerformanceReport = {
      generated_at: '2026-11-24 10:00:00',
      proyek_detail: {
        proyek: {
          id_proyek: 1,
          id_pembuat: 1,
          kode_proyek: 'PRJ-001',
          nama_proyek: 'Jembatan Nusantara',
          dinas_pemberi_kerja: 'Dinas PUPR',
          nilai_kontrak: 1000000000,
          tanggal_mulai: '2026-01-01',
          tanggal_selesai: '2026-12-31',
          status_proyek: 'Aktif',
          rab: {
            id_rab: 1,
            id_proyek: 1,
            total_pagu: 800000000,
            sisa_pagu: 750000000,
            tanggal_ditetapkan: '2026-01-01',
            versi_rab: 'v1',
          },
          termin: [
            {
              id_termin: 1,
              id_proyek: 1,
              nomor_termin: 1,
              target_persentase: 30,
              nilai_tagihan: 300000000,
              tenggat_waktu: '2026-04-01',
              status_penagihan: 'Belum siap',
              estimasi_kerugian: 0,
              tanggal_pengajuan: null,
              nomor_surat_serah: null,
              nomor_sp2d: null,
              tanggal_cair: null,
              catatan_koreksi_dinas: null,
            },
          ],
        },
        rekap_progres: {
          persentase_realisasi_terakhir: 25,
          tanggal_lapor_terakhir: '2026-03-15',
          total_laporan_progres: 3,
        },
        rekap_termin: {
          total_termin: 1,
          termin_cair: 0,
          termin_belum_cair: 1,
          total_tagihan_cair: 0,
          sisa_tagihan: 300000000,
        },
      },
      early_warning: {
        id_proyek: 1,
        kode_proyek: 'PRJ-001',
        nama_proyek: 'Jembatan Nusantara',
        tanggal_evaluasi: '2026-03-20',
        status: 'Aman',
        termin_berjalan: null,
        progres: {
          realisasi_terakhir: 25,
          tanggal_lapor_terakhir: '2026-03-15',
          target_ekspektasi: 22,
          deviasi_poin: 3,
          gap_ke_target_termin: 5,
          laju_per_hari: 0.8,
        },
        prediksi: {
          hari_terlambat_progres: 0,
          hari_terlambat_kendala: 0,
          estimasi_hari_terlambat: 0,
          estimasi_kerugian: 0,
        },
        skor_kendala: 0,
        kendala_aktif: [],
        faktor_penyebab: [],
        kurva_s: { target: [], realisasi: [] },
        rekomendasi: { teks: 'Aman', sumber: 'rule' },
      },
      riwayat_progres: [],
      riwayat_kendala: [],
      fasilitas_kredit: [
        {
          id_kredit: 1,
          id_proyek: 1,
          id_pencatat: 2,
          nama_bank: 'Bank Mandiri',
          nomor_fasilitas: 'KMK-01',
          plafon_kredit: 500000000,
          suku_bunga: 9.5,
          tenor_bulan: 12,
          tanggal_koordinasi: '2026-02-01',
          tanggal_jatuh_tempo_baru: '2027-02-01',
          status_koordinasi: 'Disetujui',
          catatan_kesepakatan: 'Lancar',
        },
      ],
    };

    const blob = buildPerformanceReportXlsx(report);
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // Signature ZIP PK\x03\x04
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);

    const decoded = new TextDecoder().decode(bytes);
    expect(decoded).toContain('xl/workbook.xml');
    expect(decoded).toContain('xl/worksheets/sheet1.xml');
    expect(decoded).toContain('xl/worksheets/sheet2.xml');
    expect(decoded).toContain('xl/worksheets/sheet3.xml');
    expect(decoded).toContain('Jembatan Nusantara');
    expect(decoded).toContain('Bank Mandiri');
  });
});
