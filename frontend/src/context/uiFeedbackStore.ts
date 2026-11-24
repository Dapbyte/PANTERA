import { createContext, useContext } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
}

export interface AutoPopupOptions {
  title: string;
  message: string;
  autoCloseSeconds?: number;
}

export interface ToastOptions {
  type?: 'success' | 'error' | 'info';
  message: string;
}

export interface UiFeedbackContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  showAutoPopup: (options: AutoPopupOptions) => void;
  showToast: (options: ToastOptions) => void;
}

export const UiFeedbackContext = createContext<UiFeedbackContextValue | null>(null);

export function useUiFeedback(): UiFeedbackContextValue {
  const ctx = useContext(UiFeedbackContext);
  if (!ctx) {
    throw new Error('useUiFeedback harus digunakan di dalam UiFeedbackProvider.');
  }
  return ctx;
}
