import React, { useRef, useState } from 'react';
import {
  materialService,
  type MaterialItemPayload,
  type RequestMaterial,
  type SifatPengajuan,
} from '../../services';
import { extractApiError } from '../../lib/api';
import {
  CustomSelect,
  FieldError,
  NumberInput,
  WheelDatePicker,
} from '../ui';
import { Plus, Send, Trash2, X } from 'lucide-react';

interface MaterialRequestModalProps {
  idProyek: number;
  initialRequest?: RequestMaterial | null;
  onClose: () => void;
  onSubmitted: (saved: RequestMaterial) => void;
}

const DEFAULT_ITEM: MaterialItemPayload = {
  nama_material: '',
  volume: 1,
  satuan: 'sak',
};

const SATUAN_OPTIONS = [
  'sak',
  'm³',
  'm²',
  'kg',
  'ton',
  'batang',
  'lembar',
  'unit',
  'set',
  'liter',
  'drum',
  'truk',
  'pail',
  'ls',
].map((s) => ({ value: s, label: s }));

function defaultTanggalButuh(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

/**
 * Modal pengajuan kebutuhan material oleh Admin Lapangan (hanya item, volume, satuan dropdown — TANPA harga).
 * Dilengkapi bottom-sheet gesture swipe/tap pada mobile (LAP-01).
 */
export const MaterialRequestModal: React.FC<MaterialRequestModalProps> = ({
  idProyek,
  initialRequest = null,
  onClose,
  onSubmitted,
}) => {
  const isEditingRevision = Boolean(initialRequest);

  const [sifat, setSifat] = useState<SifatPengajuan>(
    initialRequest?.sifat_pengajuan ?? 'Rutin'
  );
  const [tanggalButuh, setTanggalButuh] = useState<string>(
    initialRequest?.tanggal_butuh ?? defaultTanggalButuh()
  );
  const [catatanLapangan, setCatatanLapangan] = useState<string>(
    initialRequest?.catatan_lapangan ?? ''
  );
  const [items, setItems] = useState<MaterialItemPayload[]>(() => {
    if (initialRequest?.item_material && initialRequest.item_material.length > 0) {
      return initialRequest.item_material.map((it) => ({
        nama_material: it.nama_material,
        volume: Number(it.volume),
        satuan: it.satuan,
      }));
    }
    return [{ ...DEFAULT_ITEM }];
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // Mobile bottom sheet drag-to-close gesture state (LAP-01)
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const didDrag = useRef(false);

  const beginDrag = (clientY: number) => {
    dragStartY.current = clientY;
    didDrag.current = false;
  };

  const moveDrag = (clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = Math.max(0, clientY - dragStartY.current);
    if (delta > 6) didDrag.current = true;
    setDragY(delta);
  };

  const endDrag = () => {
    if (dragStartY.current === null) return;
    if (dragY > 80) {
      dragStartY.current = null;
      setDragY(0);
      onClose();
      return;
    }
    dragStartY.current = null;
    setDragY(0);
  };

  const handleUpdateItem = <K extends keyof MaterialItemPayload>(
    index: number,
    field: K,
    value: MaterialItemPayload[K]
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setFieldErrors((prev) => ({
      ...prev,
      [`nama_${index}`]: undefined,
      [`vol_${index}`]: undefined,
      [`sat_${index}`]: undefined,
    }));
    setError(null);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...DEFAULT_ITEM }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string | undefined> = {};

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalButuh)) {
      errs.tanggalButuh = 'Tanggal butuh wajib dipilih.';
    }

    items.forEach((it, idx) => {
      if (!it.nama_material.trim()) {
        errs[`nama_${idx}`] = 'Nama material wajib diisi.';
      }
      if (!Number.isFinite(Number(it.volume)) || Number(it.volume) <= 0) {
        errs[`vol_${idx}`] = 'Volume harus > 0.';
      }
      if (!it.satuan.trim()) {
        errs[`sat_${idx}`] = 'Satuan wajib dipilih.';
      }
    });

    if (Object.values(errs).some(Boolean)) {
      setFieldErrors(errs);
      return;
    }

    const validItems: MaterialItemPayload[] = items.map((it) => ({
      nama_material: it.nama_material.trim(),
      volume: Number(it.volume),
      satuan: it.satuan.trim(),
    }));

    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    try {
      const saved =
        isEditingRevision && initialRequest
          ? await materialService.revise(initialRequest.id_request, {
              sifat_pengajuan: sifat,
              tanggal_butuh: tanggalButuh,
              catatan_lapangan: catatanLapangan.trim() || undefined,
              items: validItems,
            })
          : await materialService.create({
              id_proyek: idProyek,
              sifat_pengajuan: sifat,
              tanggal_butuh: tanggalButuh,
              catatan_lapangan: catatanLapangan.trim() || undefined,
              items: validItems,
            });
      onSubmitted(saved);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal mengirim pengajuan material.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gray-100 bg-white shadow-2xl transition-transform sm:rounded-3xl"
      >
        {/* Interactive Drag / Tap Handle Bar untuk Mobile Bottom Sheet (LAP-01) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Tarik ke bawah atau ketuk untuk menutup"
          onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientY)}
          onTouchEnd={endDrag}
          onPointerDown={(e) => beginDrag(e.clientY)}
          onPointerMove={(e) => moveDrag(e.clientY)}
          onPointerUp={endDrag}
          onClick={() => {
            if (!didDrag.current) onClose();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') onClose();
          }}
          className="sticky top-0 z-10 flex w-full cursor-grab touch-none flex-col items-center rounded-t-3xl bg-white pb-2 pt-3 active:cursor-grabbing sm:hidden"
        >
          <span className="h-1.5 w-14 rounded-full bg-gray-300" />
          <span className="mt-1 text-[10px] font-medium text-gray-400">
            Geser ke bawah atau ketuk di sini untuk tutup
          </span>
        </div>

        <div className="space-y-4 p-5 pt-2 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEditingRevision
                  ? `Perbaiki Ajuan ${initialRequest?.no_request}`
                  : 'Unggah Ajuan Material'}
              </h3>
              <p className="text-[11px] text-gray-500">
                Isi jenis material dan kebutuhan volume lapangan (harga dilengkapi oleh Keuangan)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {(initialRequest?.alasan_penolakan ||
            initialRequest?.catatan_keuangan ||
            initialRequest?.catatan_direktur) && (
            <div className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              <div className="font-bold">Alasan Penolakan / Catatan Revisi:</div>
              <div>
                {initialRequest.alasan_penolakan ||
                  initialRequest.catatan_direktur ||
                  initialRequest.catatan_keuangan}
              </div>
            </div>
          )}

          {/* Sifat Pengajuan */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSifat('Rutin')}
              className={`rounded-full px-3 py-2 text-center text-xs font-medium transition ${
                sifat === 'Rutin'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Rutin
            </button>
            <button
              type="button"
              onClick={() => setSifat('Darurat')}
              className={`rounded-full px-3 py-2 text-center text-xs font-medium transition ${
                sifat === 'Darurat'
                  ? 'border border-rose-200 bg-rose-50 font-semibold text-rose-600 shadow-sm'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Darurat
            </button>
          </div>

          {/* Tanggal Dibutuhkan & Catatan */}
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-gray-700">Tanggal Dibutuhkan</label>
              <WheelDatePicker
                ariaLabel="Tanggal Dibutuhkan Material"
                hasError={Boolean(fieldErrors.tanggalButuh)}
                value={tanggalButuh}
                onChange={(val) => {
                  setTanggalButuh(val);
                  setFieldErrors((p) => ({ ...p, tanggalButuh: undefined }));
                }}
              />
              <FieldError message={fieldErrors.tanggalButuh} />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-gray-700">
                Catatan Lapangan (Opsional)
              </label>
              <input
                type="text"
                value={catatanLapangan}
                onChange={(e) => setCatatanLapangan(e.target.value)}
                placeholder="Misal: Untuk pengecoran pilar"
                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-gray-800 focus:border-[#1877F2] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Daftar Item: Nama Material, Volume, Satuan (Dropdown) — TANPA Harga */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-2xl border border-gray-200 bg-slate-50/80 p-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    Item Material #{idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      aria-label={`Hapus item ${idx + 1}`}
                      className="rounded-md p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">
                    Nama Material
                  </label>
                  <input
                    type="text"
                    value={item.nama_material}
                    onChange={(e) => handleUpdateItem(idx, 'nama_material', e.target.value)}
                    placeholder="Contoh: Semen PCC 50 kg"
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-gray-800 focus:outline-none ${
                      fieldErrors[`nama_${idx}`]
                        ? 'border-rose-400'
                        : 'border-gray-200 focus:border-[#1877F2]'
                    }`}
                  />
                  <FieldError message={fieldErrors[`nama_${idx}`]} />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">
                      Volume
                    </label>
                    <NumberInput
                      ariaLabel={`Volume item ${idx + 1}`}
                      allowDecimal
                      min={0}
                      hasError={Boolean(fieldErrors[`vol_${idx}`])}
                      value={item.volume}
                      onChange={(val) => handleUpdateItem(idx, 'volume', val)}
                      className="bg-white font-bold"
                    />
                    <FieldError message={fieldErrors[`vol_${idx}`]} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">
                      Satuan
                    </label>
                    <CustomSelect
                      ariaLabel={`Satuan item ${idx + 1}`}
                      hasError={Boolean(fieldErrors[`sat_${idx}`])}
                      value={item.satuan}
                      onChange={(val) => handleUpdateItem(idx, 'satuan', val)}
                      options={SATUAN_OPTIONS}
                      buttonClassName="bg-white"
                    />
                    <FieldError message={fieldErrors[`sat_${idx}`]} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex w-full items-center justify-center gap-1 rounded-full border border-gray-300 py-2.5 text-xs font-semibold text-[#1877F2] hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah item</span>
          </button>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] py-3 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {submitting
                  ? 'Mengirim…'
                  : isEditingRevision
                    ? 'Ajukan Ulang Revisi'
                    : 'Kirim Pengajuan Kebutuhan'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Batal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
