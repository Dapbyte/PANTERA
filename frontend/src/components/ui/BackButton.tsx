import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  title?: string;
  className?: string;
}

/**
 * Tombol kembali dengan card/padding biru tema & ikon panah putih (GLB-09).
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label,
  title = 'Kembali',
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-600 focus-visible:outline-[#1877F2] ${className}`}
  >
    <ArrowLeft className="h-4 w-4 text-white shrink-0" />
    {label && <span>{label}</span>}
  </button>
);
