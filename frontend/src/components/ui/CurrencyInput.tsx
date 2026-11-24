import React from 'react';
import { formatRibuan, parseRibuan } from '../../lib/formatters';

interface CurrencyInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  hasError?: boolean;
  className?: string;
}

/**
 * Input nominal uang dengan pemisah titik ribuan otomatis & pergantian angka 0 default (DIR-04 & LAP-02).
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  required = false,
  ariaLabel,
  hasError = false,
  className = '',
}) => {
  const displayValue = formatRibuan(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.trim() === '') {
      onChange(0);
      return;
    }
    onChange(parseRibuan(raw));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      disabled={disabled}
      required={required}
      value={displayValue}
      placeholder={placeholder}
      onFocus={(e) => e.currentTarget.select()}
      onChange={handleChange}
      className={`w-full rounded-xl border px-3 py-2 font-mono text-xs transition focus:outline-none ${
        hasError
          ? 'border-rose-400 bg-rose-50/40 text-rose-700 focus:border-rose-500'
          : 'border-gray-200 bg-slate-50 text-gray-800 focus:border-[#1877F2] focus:bg-white'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    />
  );
};
