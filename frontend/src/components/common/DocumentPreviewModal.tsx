import React, { useEffect, useState } from 'react';
import { extractApiError } from '../../lib/api';
import { Download, ExternalLink, FileText, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';

export interface DocumentPreviewModalProps {
  title: string;
  subtitle?: string;
  fetchBlob?: () => Promise<{ blob: Blob; contentType: string }>;
  localFile?: File | null;
  fileNameHint?: string;
  onDownload?: () => Promise<void> | void;
  onClose: () => void;
}

/**
 * Modal preview dokumen inline reusable (PDF, gambar, kontrol zoom, dan fallback Buka di Tab Baru).
 */
export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  title,
  subtitle,
  fetchBlob,
  localFile = null,
  fileNameHint = '',
  onDownload,
  onClose,
}) => {
  const [remoteState, setRemoteState] = useState<{ url: string; contentType: string } | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [localState, setLocalState] = useState<{ file: File; url: string } | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [onClose]);

  // Buat dan cabut Object URL di dalam useEffect yang sama agar aman di React StrictMode
  useEffect(() => {
    if (!localFile) return;
    let cancelled = false;
    const url = URL.createObjectURL(localFile);
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLocalState({ file: localFile, url });
      }
    });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [localFile]);

  const localObjectUrl = localState?.file === localFile ? localState.url : null;

  useEffect(() => {
    if (localFile || !fetchBlob) return;
    let cancelled = false;
    let createdUrl = '';

    fetchBlob()
      .then(({ blob, contentType }) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setRemoteState({ url: createdUrl, contentType });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRemoteError(extractApiError(err, 'Berkas dokumen gagal dimuat untuk pratinjau.'));
        }
      });

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fetchBlob, localFile]);

  const objectUrl = localFile ? localObjectUrl : (remoteState?.url ?? null);
  const contentType = localFile ? localFile.type : (remoteState?.contentType ?? '');
  const lowerName = (localFile?.name || fileNameHint || title).toLowerCase();
  const isPdf = contentType.includes('pdf') || lowerName.endsWith('.pdf');
  const isImage =
    contentType.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(lowerName);
  const isLoading = Boolean(!localFile && fetchBlob && !remoteState && !remoteError);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/65 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${title}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">{title}</h3>
              {subtitle && <p className="truncate text-[11px] text-gray-500">{subtitle}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {objectUrl && !isPdf && isImage && (
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-slate-50 p-0.5 text-[11px]">
                <button
                  type="button"
                  aria-label="Perkecil pratinjau"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  className="rounded-full p-1.5 text-gray-600 hover:bg-white hover:text-[#1877F2]"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Reset zoom pratinjau"
                  onClick={() => setZoom(100)}
                  className="px-2 font-mono text-[11px] font-semibold text-gray-700"
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  aria-label="Perbesar pratinjau"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  className="rounded-full p-1.5 text-gray-600 hover:bg-white hover:text-[#1877F2]"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {objectUrl && (
              <button
                type="button"
                onClick={() => window.open(objectUrl, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tab Baru</span>
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                onClick={() => void onDownload()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-600"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh</span>
              </button>
            )}
            <button
              type="button"
              aria-label="Tutup pratinjau"
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-50 p-3 min-h-[300px] sm:min-h-[360px] sm:p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#1877F2]" />
              <span>Memuat pratinjau dokumen…</span>
            </div>
          ) : remoteError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-700">
              {remoteError}
            </div>
          ) : objectUrl ? (
            isPdf ? (
              <>
                <div className="hidden w-full sm:block">
                  <div className="relative isolate h-[64dvh] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <iframe
                      title={`Preview ${title}`}
                      src={objectUrl}
                      className="h-full w-full border-0 bg-white"
                    />
                  </div>
                </div>
                <div className="w-full sm:hidden">
                  <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1877F2]">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="w-full truncate text-xs font-bold text-gray-900">
                      {localFile?.name || fileNameHint || title}
                    </div>
                    {subtitle && (
                      <div className="mt-0.5 w-full truncate text-[11px] text-gray-500">
                        {subtitle}
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-gray-500">
                      Pratinjau PDF di layar kecil dibuka di tab baru agar tampilan tetap rapi.
                    </p>
                    <div className="mt-4 flex w-full flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(objectUrl, '_blank', 'noopener,noreferrer')}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Buka PDF di Tab Baru</span>
                      </button>
                      {onDownload && (
                        <button
                          type="button"
                          onClick={() => void onDownload()}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Unduh</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : isImage ? (
              <div className="flex max-h-[68dvh] w-full items-center justify-center overflow-auto">
                <img
                  src={objectUrl}
                  alt={title}
                  style={{ width: zoom === 100 ? undefined : `${zoom}%` }}
                  className={
                    zoom === 100
                      ? 'max-h-[64dvh] w-auto rounded-xl object-contain shadow-sm'
                      : 'h-auto max-w-none rounded-xl object-contain shadow-sm'
                  }
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-600 space-y-2">
                <FileText className="mx-auto h-10 w-10 text-[#1877F2]" />
                <div className="font-semibold text-gray-800">
                  Pratinjau langsung tidak tersedia untuk format berkas ini.
                </div>
                <p>Gunakan tombol Unduh di atas untuk membuka dokumen.</p>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};
