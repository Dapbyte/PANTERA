import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { formatTanggal } from '../../lib/formatters';

interface WheelDatePickerProps {
  value: string;
  onChange: (yyyyMmDd: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  clearable?: boolean;
  hasError?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function daysInMonth(year: number, monthIndexZero: number): number {
  return new Date(year, monthIndexZero + 1, 0).getDate();
}

function parseIsoDate(raw: string, minYear: number, maxYear: number) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m) {
    const y = Math.min(maxYear, Math.max(minYear, Number(m[1])));
    const mo = Math.min(11, Math.max(0, Number(m[2]) - 1));
    const maxD = daysInMonth(y, mo);
    const d = Math.min(maxD, Math.max(1, Number(m[3])));
    return { year: y, month: mo, day: d };
  }
  const now = new Date();
  return {
    year: Math.min(maxYear, Math.max(minYear, now.getFullYear())),
    month: now.getMonth(),
    day: now.getDate(),
  };
}

function toIsoString(year: number, monthZero: number, day: number): string {
  const mStr = String(monthZero + 1).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}

interface WheelColumnProps {
  label: string;
  items: Array<{ value: number; text: string }>;
  selectedValue: number;
  onSelect: (val: number) => void;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  label,
  items,
  selectedValue,
  onSelect,
}) => {
  const colRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<(delta: number) => void>(() => undefined);

  const currentIndex = Math.max(
    0,
    items.findIndex((it) => it.value === selectedValue)
  );

  const step = (delta: number) => {
    const nextIdx = (currentIndex + delta + items.length) % items.length;
    onSelect(items[nextIdx].value);
  };

  useEffect(() => {
    stepRef.current = (delta: number) => {
      const nextIdx = (currentIndex + delta + items.length) % items.length;
      onSelect(items[nextIdx].value);
    };
  }, [currentIndex, items, onSelect]);

  // Registrasi non-passive listener agar e.preventDefault() tidak memicu warning console (BUG 3.4)
  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      stepRef.current(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
    };
  }, []);

  const visibleOffsets = [-2, -1, 0, 1, 2];

  return (
    <div ref={colRef} className="flex flex-1 flex-col items-center select-none">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </div>
      <button
        type="button"
        aria-label={`Kurangi ${label}`}
        onClick={() => step(-1)}
        className="rounded-lg p-1 text-gray-400 hover:bg-blue-50 hover:text-[#1877F2]"
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="relative my-1 flex w-full flex-col items-center overflow-hidden rounded-2xl bg-slate-50 py-1">
        {visibleOffsets.map((offset) => {
          const idx = (currentIndex + offset + items.length) % items.length;
          const item = items[idx];
          const isCenter = offset === 0;
          return (
            <button
              key={`${offset}-${item.value}`}
              type="button"
              onClick={() => onSelect(item.value)}
              className={`w-full py-1.5 text-center transition ${
                isCenter
                  ? 'bg-[#EAF3FF] font-bold text-sm text-[#1877F2] border-y border-blue-200'
                  : Math.abs(offset) === 1
                    ? 'text-xs font-medium text-gray-500 hover:text-gray-800'
                    : 'text-[11px] text-gray-300 hover:text-gray-500'
              }`}
            >
              {item.text}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label={`Tambah ${label}`}
        onClick={() => step(1)}
        className="rounded-lg p-1 text-gray-400 hover:bg-blue-50 hover:text-[#1877F2]"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
};

/**
 * Wheel Date Picker ergonomis menggantikan input kalender bawaan browser (GLB-06 & ARS-11).
 */
export const WheelDatePicker: React.FC<WheelDatePickerProps> = ({
  value,
  onChange,
  ariaLabel = 'Pilih tanggal',
  placeholder = 'Pilih tanggal',
  minYear = 1990,
  maxYear = 2050,
  disabled = false,
  clearable = false,
  hasError = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const initial = parseIsoDate(value, minYear, maxYear);
  const [draftYear, setDraftYear] = useState(initial.year);
  const [draftMonth, setDraftMonth] = useState(initial.month);
  const [draftDay, setDraftDay] = useState(initial.day);

  const openPicker = () => {
    if (disabled) return;
    const parsed = parseIsoDate(value, minYear, maxYear);
    setDraftYear(parsed.year);
    setDraftMonth(parsed.month);
    setDraftDay(parsed.day);
    setOpen(true);
  };

  const maxDay = daysInMonth(draftYear, draftMonth);
  const safeDay = Math.min(draftDay, maxDay);

  const dayItems = useMemo(
    () =>
      Array.from({ length: maxDay }, (_, i) => ({
        value: i + 1,
        text: String(i + 1).padStart(2, '0'),
      })),
    [maxDay]
  );

  const monthItems = useMemo(
    () => MONTH_NAMES.map((name, idx) => ({ value: idx, text: name })),
    []
  );

  const yearItems = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
        value: minYear + i,
        text: String(minYear + i),
      })),
    [minYear, maxYear]
  );

  const applyDate = () => {
    onChange(toIsoString(draftYear, draftMonth, safeDay));
    setOpen(false);
  };

  const setToday = () => {
    const now = new Date();
    const y = Math.min(maxYear, Math.max(minYear, now.getFullYear()));
    const m = now.getMonth();
    const d = now.getDate();
    setDraftYear(y);
    setDraftMonth(m);
    setDraftDay(d);
    onChange(toIsoString(y, m, d));
    setOpen(false);
  };

  return (
    <>
      <div className={`relative flex items-center ${className}`}>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          onClick={openPicker}
          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition ${
            hasError
              ? 'border-rose-400 bg-rose-50/40 text-rose-700'
              : 'border-gray-200 bg-slate-50 text-gray-800 hover:border-blue-300 hover:bg-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center gap-2 truncate">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#1877F2]" />
            <span className={value ? 'font-medium text-gray-800' : 'text-gray-400'}>
              {value ? formatTanggal(value) : placeholder}
            </span>
          </span>
        </button>

        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label="Hapus tanggal"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute right-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-slate-900/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-2xl space-y-4 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{ariaLabel}</h3>
                <p className="text-[11px] font-medium text-[#1877F2]">
                  {formatTanggal(toIsoString(draftYear, draftMonth, safeDay))}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup pemilih tanggal"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2.5">
              <WheelColumn
                label="Tgl"
                items={dayItems}
                selectedValue={safeDay}
                onSelect={(d) => setDraftDay(d)}
              />
              <WheelColumn
                label="Bulan"
                items={monthItems}
                selectedValue={draftMonth}
                onSelect={(m) => setDraftMonth(m)}
              />
              <WheelColumn
                label="Tahun"
                items={yearItems}
                selectedValue={draftYear}
                onSelect={(y) => setDraftYear(y)}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={setToday}
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-[#1877F2] hover:bg-blue-100"
              >
                Hari Ini
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={applyDate}
                  className="rounded-full bg-[#1877F2] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                >
                  Pilih
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
