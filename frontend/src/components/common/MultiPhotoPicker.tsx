import React, { useEffect, useState } from 'react';
import { archiveService } from '../../services';
import { formatFileSize } from '../../lib/mediaHelpers';
import { Camera, FolderOpen, X, ZoomIn } from 'lucide-react';

interface MultiPhotoPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
  maxFiles?: number;
}

/**
 * Komponen input multi-foto untuk Progres Fisik & Kendala Lapangan (2.1):
 * memilih foto baru selalu MENAMBAH ke daftar (tidak menimpa foto sebelumnya),
 * mendukung kamera maupun galeri multi-pilih, pratinjau, serta hapus per foto.
 */
export const MultiPhotoPicker: React.FC<MultiPhotoPickerProps> = ({
  files,
  onChange,
  label = 'Foto dokumentasi (opsional, bisa lebih dari satu)',
  maxFiles = 10,
}) => {
  const [zoomUrl, setZoomUrl] = useState<{ url: string; name: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [previewEntries, setPreviewEntries] = useState<
    Array<{ key: string; file: File; url: string }>
  >([]);

  // Buat dan cabut Object URL di dalam useEffect agar tetap valid pada React StrictMode
  useEffect(() => {
    let cancelled = false;
    const next = files.map((file, idx) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${idx}`,
      file,
      url: URL.createObjectURL(file),
    }));
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setPreviewEntries(next);
      }
    });
    return () => {
      cancelled = true;
      next.forEach((entry) => URL.revokeObjectURL(entry.url));
    };
  }, [files]);

  const appendFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const picked = Array.from(incoming);
    const combined = [...files, ...picked];
    if (combined.length > maxFiles) {
      setLimitNotice(`Maksimal ${maxFiles} foto per laporan. Foto tambahan dipangkas.`);
      onChange(combined.slice(0, maxFiles));
    } else {
      setLimitNotice(null);
      onChange(combined);
    }
  };

  const removeAt = (idx: number) => {
    setLimitNotice(null);
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-gray-700 text-xs">{label}</label>
        {files.length > 0 && (
          <span className="text-[11px] font-semibold text-[#1877F2]">
            {files.length} / {maxFiles} foto terpilih
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-2.5 text-[11px] font-semibold text-[#1877F2] transition hover:bg-blue-100">
          <Camera className="h-3.5 w-3.5 shrink-0" />
          <span>Ambil Foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              appendFiles(e.target.files);
              e.target.value = '';
            }}
            className="hidden"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-slate-50 px-2.5 py-2.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100">
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#1877F2]" />
          <span>Pilih Galeri</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg"
            onChange={(e) => {
              appendFiles(e.target.files);
              e.target.value = '';
            }}
            className="hidden"
          />
        </label>
      </div>

      {limitNotice && (
        <div className="text-[11px] font-medium text-amber-700">{limitNotice}</div>
      )}

      {previewEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 pt-1">
          {previewEntries.map((entry, idx) => (
            <div
              key={entry.key}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs"
            >
              <button
                type="button"
                onClick={() => setZoomUrl({ url: entry.url, name: entry.file.name })}
                className="relative block h-24 w-full overflow-hidden bg-slate-100"
                aria-label={`Pratinjau foto ${entry.file.name}`}
              >
                <img
                  src={entry.url}
                  alt={entry.file.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 rounded-full bg-slate-900/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                  <ZoomIn className="h-3 w-3" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label={`Hapus foto ${entry.file.name}`}
                className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="px-2 py-1 text-[10px] leading-tight">
                <div className="truncate font-semibold text-gray-800">{entry.file.name}</div>
                <div className="text-gray-400">{formatFileSize(entry.file.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {zoomUrl && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <span className="truncate text-xs font-semibold text-gray-800">{zoomUrl.name}</span>
              <button
                type="button"
                aria-label="Tutup foto"
                onClick={() => setZoomUrl(null)}
                className="rounded-full bg-slate-100 p-1.5 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={zoomUrl.url}
              alt={zoomUrl.name}
              className="max-h-[75vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface PhotoThumbnailGridProps {
  paths: string[];
  altPrefix: string;
}

/**
 * Grid thumbnail multi-foto tersimpan pada riwayat progres/kendala dengan modal zoom inline.
 */
export const PhotoThumbnailGrid: React.FC<PhotoThumbnailGridProps> = ({ paths, altPrefix }) => {
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  if (paths.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {paths.map((p, idx) => {
          const href = archiveService.getDigitalFileUrl(p);
          if (!href) return null;
          return (
            <button
              key={`${p}-${idx}`}
              type="button"
              onClick={() => setZoomSrc(href)}
              className="group relative h-20 w-full overflow-hidden rounded-xl border border-gray-100 bg-slate-100"
              aria-label={`Lihat ${altPrefix} #${idx + 1}`}
            >
              <img
                src={href}
                alt={`${altPrefix} #${idx + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </button>
          );
        })}
      </div>

      {zoomSrc && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomSrc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-gray-800">{altPrefix}</span>
              <button
                type="button"
                aria-label="Tutup foto"
                onClick={() => setZoomSrc(null)}
                className="rounded-full bg-slate-100 p-1.5 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={zoomSrc}
              alt={altPrefix}
              className="max-h-[78vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};
