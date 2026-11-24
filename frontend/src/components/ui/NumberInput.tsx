import React, { useState } from 'react';

interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Input angka ergonomis: angka 0 default langsung tergantikan saat mengetik dan kembali ke 0 bila dikosongkan.
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  value,
  onChange,
  allowDecimal = false,
  min = 0,
  max,
  disabled = false,
  required = false,
  ariaLabel,
  hasError = false,
  placeholder = '0',
  className = '',
}) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const display = focused ? draft : String(Number.isFinite(value) ? value : 0);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    setDraft(String(Number.isFinite(value) ? value : 0));
    window.requestAnimationFrame(() => e.target.select());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(',', '.');
    raw = allowDecimal ? raw.replace(/[^0-9.]/g, '') : raw.replace(/\D/g, '');
    if (allowDecimal) {
      const parts = raw.split('.');
      if (parts.length > 2) {
        raw = `${parts[0]}.${parts.slice(1).join('')}`;
      }
    }

    if (raw === '') {
      setDraft('0');
      onChange(0);
      return;
    }

    if (raw.length > 1 && raw.startsWith('0') && !raw.startsWith('0.')) {
      raw = raw.replace(/^0+/, '') || '0';
    }

    let num = Number(raw);
    if (!Number.isFinite(num)) num = 0;
    if (min !== undefined && num < min && raw !== '0' && !raw.endsWith('.')) {
      num = min;
    }
    if (max !== undefined && num > max) {
      num = max;
      raw = String(max);
    }

    setDraft(raw);
    onChange(num);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      disabled={disabled}
      required={required}
      value={display}
      placeholder={placeholder}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`w-full rounded-xl border px-3 py-2 text-xs transition focus:outline-none ${
        hasError
          ? 'border-rose-400 bg-rose-50/40 text-rose-700 focus:border-rose-500'
          : 'border-gray-200 bg-slate-50 text-gray-800 focus:border-[#1877F2] focus:bg-white'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    />
  );
};
