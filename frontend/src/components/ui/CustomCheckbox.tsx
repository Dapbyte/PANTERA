import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Checkbox custom bertema PANTERA (KEU-02).
 */
export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => {
      if (!disabled) onChange(!checked);
    }}
    className={`inline-flex items-center gap-2 text-left text-xs select-none ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
    } ${className}`}
  >
    <span
      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition ${
        checked
          ? 'border-[#1877F2] bg-[#1877F2] text-white shadow-xs'
          : 'border-gray-300 bg-white hover:border-[#1877F2]'
      }`}
    >
      {checked && <Check className="h-3 w-3 stroke-[3]" />}
    </span>
    {label && <span className="text-gray-700">{label}</span>}
  </button>
);
