import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MaterialRequestModal } from '../src/components/admin/MaterialRequestModal';
import { materialService, type RequestMaterial } from '../src/services';

vi.mock('../src/services', async () => {
  const actual = await vi.importActual<typeof import('../src/services')>('../src/services');
  return {
    ...actual,
    materialService: {
      ...actual.materialService,
      create: vi.fn(),
      revise: vi.fn(),
    },
  };
});

describe('MaterialRequestModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without any price input, allows item add/remove + unit dropdown, and submits volume only', async () => {
    const mockSaved: RequestMaterial = {
      id_request: 10,
      no_request: 'REQ-20261124-001',
      id_proyek: 1,
      id_pengaju: 3,
      id_validator: null,
      id_direktur: null,
      id_arsip_ref: null,
      tanggal_pengajuan: '2026-11-24',
      tanggal_butuh: '2026-11-27',
      sifat_pengajuan: 'Darurat',
      total_estimasi: null,
      status_approval: 'Diajukan',
      catatan_direktur: null,
      catatan_keuangan: null,
      catatan_lapangan: null,
      alasan_penolakan: null,
      melebihi_rab: false,
      skema_pembayaran: null,
    };

    vi.mocked(materialService.create).mockResolvedValueOnce(mockSaved);

    const onSubmitted = vi.fn();
    render(
      <MaterialRequestModal
        idProyek={1}
        onClose={vi.fn()}
        onSubmitted={onSubmitted}
      />
    );

    // Pastikan tidak ada field harga / estimasi_harga untuk Admin Lapangan (KEU-01 / LAP-02)
    expect(screen.queryByLabelText(/harga/i)).not.toBeInTheDocument();
    expect(screen.getByText(/harga dilengkapi oleh Keuangan/i)).toBeInTheDocument();

    // Tambah 1 item lagi lalu hapus item kedua
    fireEvent.click(screen.getByRole('button', { name: /Tambah item/i }));
    expect(screen.getByText('Item Material #2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus item 2' }));
    expect(screen.queryByText('Item Material #2')).not.toBeInTheDocument();

    // Isi material, volume (via NumberInput), dan satuan (via CustomSelect dropdown)
    fireEvent.change(screen.getByPlaceholderText(/Semen PCC/i), {
      target: { value: 'Semen PCC' },
    });

    const volInput = screen.getByLabelText('Volume item 1');
    fireEvent.focus(volInput);
    fireEvent.change(volInput, { target: { value: '15' } });
    fireEvent.blur(volInput);

    // Buka CustomSelect Satuan lalu pilih 'ton'
    fireEvent.click(screen.getByLabelText('Satuan item 1'));
    fireEvent.click(screen.getByRole('option', { name: 'ton' }));

    fireEvent.click(screen.getByRole('button', { name: 'Darurat' }));
    fireEvent.click(screen.getByRole('button', { name: /Kirim Pengajuan Kebutuhan/i }));

    await waitFor(() => {
      expect(materialService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_proyek: 1,
          sifat_pengajuan: 'Darurat',
          tanggal_butuh: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          items: [
            {
              nama_material: 'Semen PCC',
              volume: 15,
              satuan: 'ton',
            },
          ],
        })
      );
      expect(onSubmitted).toHaveBeenCalledWith(mockSaved);
    });
  });

  it('closes modal when mobile bottom-sheet handle bar is tapped (LAP-01)', () => {
    const onClose = vi.fn();
    render(<MaterialRequestModal idProyek={1} onClose={onClose} onSubmitted={vi.fn()} />);

    const handle = screen.getByRole('button', {
      name: 'Tarik ke bawah atau ketuk untuk menutup',
    });
    fireEvent.click(handle);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
