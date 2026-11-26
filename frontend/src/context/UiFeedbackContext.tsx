import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import {
  UiFeedbackContext,
  type AutoPopupOptions,
  type ConfirmOptions,
  type PromptOptions,
  type ToastOptions,
} from './uiFeedbackStore';

interface ActiveToast extends ToastOptions {
  id: number;
}

export const UiFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const [promptState, setPromptState] = useState<{
    options: PromptOptions;
    resolve: (val: string | null) => void;
  } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);

  const [popupState, setPopupState] = useState<{
    title: string;
    message: string;
    remaining: number;
  } | null>(null);

  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const toastSeq = useRef(0);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    setPromptValue('');
    setPromptError(null);
    return new Promise<string | null>((resolve) => {
      setPromptState({ options, resolve });
    });
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { ...options, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const showAutoPopup = useCallback((options: AutoPopupOptions) => {
    setPopupState({
      title: options.title,
      message: options.message,
      remaining: options.autoCloseSeconds ?? 10,
    });
  }, []);

  useEffect(() => {
    if (!popupState) return;
    if (popupState.remaining <= 0) {
      const t = window.setTimeout(() => setPopupState(null), 0);
      return () => window.clearTimeout(t);
    }
    const timer = window.setTimeout(() => {
      setPopupState((prev) => (prev ? { ...prev, remaining: prev.remaining - 1 } : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [popupState]);

  const closeConfirm = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const submitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptState) return;
    if (promptState.options.required !== false && !promptValue.trim()) {
      setPromptError('Catatan wajib diisi terlebih dahulu.');
      return;
    }
    promptState.resolve(promptValue.trim());
    setPromptState(null);
  };

  const cancelPrompt = () => {
    if (promptState) {
      promptState.resolve(null);
      setPromptState(null);
    }
  };

  return (
    <UiFeedbackContext.Provider value={{ confirm, prompt, showAutoPopup, showToast }}>
      {children}

      {/* Custom Confirmation Modal (GLB-10 & GLB-11) */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    confirmState.options.variant === 'danger'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-blue-50 text-[#1877F2]'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{confirmState.options.title}</h3>
              </div>
              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={() => closeConfirm(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-gray-600">{confirmState.options.message}</p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                {confirmState.options.cancelLabel ?? 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`rounded-full px-5 py-2 text-xs font-semibold text-white shadow-sm ${
                  confirmState.options.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#1877F2] hover:bg-blue-600'
                }`}
              >
                {confirmState.options.confirmLabel ?? 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Prompt Modal (pengganti window.prompt) */}
      {promptState && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={cancelPrompt}
        >
          <form
            onSubmit={submitPrompt}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">{promptState.options.title}</h3>
              <button
                type="button"
                aria-label="Tutup"
                onClick={cancelPrompt}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-gray-600">{promptState.options.message}</p>

            <div>
              <textarea
                rows={3}
                value={promptValue}
                onChange={(e) => {
                  setPromptValue(e.target.value);
                  setPromptError(null);
                }}
                placeholder={promptState.options.placeholder ?? 'Tuliskan catatan...'}
                className={`w-full rounded-xl border bg-slate-50 p-3 focus:outline-none ${
                  promptError ? 'border-rose-400' : 'border-gray-200 focus:border-[#1877F2]'
                }`}
              />
              {promptError && <p className="mt-1 text-[11px] font-medium text-rose-600">{promptError}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelPrompt}
                className="rounded-full border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100"
              >
                {promptState.options.cancelLabel ?? 'Batal'}
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#1877F2] px-5 py-2 font-semibold text-white hover:bg-blue-600"
              >
                {promptState.options.confirmLabel ?? 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auto-close Popup Modal 10 detik (KEU-04) */}
      {popupState && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{popupState.title}</h3>
                  <p className="text-[11px] text-gray-400">
                    Menutup otomatis dalam {popupState.remaining} detik
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup pop up"
                onClick={() => setPopupState(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-gray-700">{popupState.message}</p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPopupState(null)}
                className="rounded-full bg-[#1877F2] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-600"
              >
                Tutup Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toasts (posisi bawah agar tidak menutupi tombol aksi kanan atas di desktop/mobile) */}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-20 left-3 right-3 z-[80] flex flex-col gap-2 sm:bottom-5 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs shadow-lg backdrop-blur-md ${
                t.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : t.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-blue-200 bg-blue-50 text-blue-900'
              }`}
            >
              {t.type === 'error' ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              ) : t.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1877F2]" />
              )}
              <span className="flex-1 font-medium">{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="rounded-full p-0.5 opacity-60 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </UiFeedbackContext.Provider>
  );
};
