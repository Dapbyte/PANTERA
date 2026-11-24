import React, { useEffect, useState } from 'react';
import { extractApiError } from '../../lib/api';
import { Download, FileText, Loader2, X } from 'lucide-react';

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
 * Modal preview dokumen inline reusable (mendukung PDF, gambar, serta berkas lokal maupun remote terautentikasi).
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
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">{title}</h3>
              {subtitle && <p className="truncate text-[11px] text-gray-500">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-50 p-4 min-h-[360px]">
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
              <iframe
                title={`Preview ${title}`}
                src={objectUrl}
                className="h-[68vh] w-full rounded-xl border border-gray-200 bg-white"
              />
            ) : isImage ? (
              <img
                src={objectUrl}
                alt={title}
                className="max-h-[68vh] w-auto rounded-xl object-contain shadow-sm"
              />
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
