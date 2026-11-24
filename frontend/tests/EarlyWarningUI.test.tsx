import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EarlyWarningStatusBadge,
  EarlyWarningStatusBanner,
} from '../src/components/common/EarlyWarningVisuals';
import type { EarlyWarningAnalysis, EarlyWarningStatus } from '../src/types/api';

function makeAnalysis(status: EarlyWarningStatus): EarlyWarningAnalysis {
  return {
    id_proyek: 1,
    kode_proyek: 'P001',
    nama_proyek: 'Pembangunan Jembatan',
    tanggal_evaluasi: '2026-03-20',
    status,
    termin_berjalan: {
      id_termin: 1,
      nomor_termin: 1,
      target_persentase: 30,
      nilai_tagihan: 300000000,
      tenggat_waktu: '2026-03-31',
      status_penagihan: 'Belum siap',
      hari_ke_tenggat: 11,
    },
    progres: {
      realisasi_terakhir: status === 'Aman' ? 32 : status === 'Waspada' ? 24 : 10,
      tanggal_lapor_terakhir: '2026-03-20',
      target_ekspektasi: 28,
      deviasi_poin: status === 'Aman' ? 4 : status === 'Waspada' ? -4 : -18,
      gap_ke_target_termin: 2,
      laju_per_hari: 1.2,
    },
    prediksi: {
      hari_terlambat_progres: status === 'Aman' ? 0 : 4,
      hari_terlambat_kendala: status === 'Aman' ? 0 : 2,
      estimasi_hari_terlambat: status === 'Aman' ? 0 : 6,
      estimasi_kerugian: status === 'Aman' ? 0 : 1800000,
    },
    skor_kendala: status === 'Aman' ? 0 : 4,
    kendala_aktif: [],
    faktor_penyebab:
      status === 'Aman' ? [] : ['Progres tertinggal dari target kurva S.'],
    kurva_s: { target: [], realisasi: [] },
    rekomendasi: {
      sumber: 'rule',
      teks:
        status === 'Aman'
          ? 'Progres sesuai target kurva S termin. Pertahankan ritme kerja.'
          : 'Percepat pekerjaan fisik.',
    },
  };
}

describe('EarlyWarningVisuals', () => {
  it('renders green theme and safe info when status is Aman', () => {
    const { container } = render(
      <>
        <EarlyWarningStatusBadge status="Aman" />
        <EarlyWarningStatusBanner analysis={makeAnalysis('Aman')} />
      </>
    );

    expect(screen.getAllByText(/Aman/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Proyek Berjalan Sesuai Kurva S/i)).toBeInTheDocument();
    expect(container.querySelector('.bg-emerald-50\\/90')).not.toBeNull();
  });

  it('renders amber theme when status is Waspada', () => {
    const { container } = render(
      <EarlyWarningStatusBanner analysis={makeAnalysis('Waspada')} />
    );

    expect(screen.getByText(/Waspada — Terdeteksi Potensi Keterlambatan/i)).toBeInTheDocument();
    expect(container.querySelector('.bg-amber-50\\/90')).not.toBeNull();
  });

  it('renders rose/red theme when status is Kritis', () => {
    const { container } = render(
      <EarlyWarningStatusBanner analysis={makeAnalysis('Kritis')} />
    );

    expect(screen.getByText(/Kritis — Risiko Tinggi Penundaan Termin/i)).toBeInTheDocument();
    expect(container.querySelector('.bg-rose-50\\/90')).not.toBeNull();
  });
});
