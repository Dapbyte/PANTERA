import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  searchable?: boolean;
  hasError?: boolean;
  className?: string;
  buttonClassName?: string;
}

/**
 * Custom dropdown konsisten bertema PANTERA (GLB-07).
 */
export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  ariaLabel,
  disabled = false,
  searchable = false,
  hasError = false,
  className = '',
  buttonClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) {
            setSearch('');
            setOpen((prev) => !prev);
          }
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition ${
          hasError
            ? 'border-rose-400 bg-rose-50/40 text-rose-700'
            : open
              ? 'border-[#1877F2] bg-white text-gray-900 ring-2 ring-[#1877F2]/15'
              : 'border-gray-200 bg-slate-50 text-gray-800 hover:border-blue-300 hover:bg-white'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <span className={`truncate ${selected ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#1877F2] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl"
        >
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari..."
                  className="w-full rounded-lg border border-gray-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-center text-[11px] text-gray-400">
                Tidak ada pilihan
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? 'bg-[#EAF3FF] font-semibold text-[#1877F2]'
                        : 'text-gray-700 hover:bg-slate-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="truncate text-[10px] text-gray-400">{opt.description}</div>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#1877F2]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
