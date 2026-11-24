import React from 'react';

interface FieldErrorProps {
  message?: string | null;
}

export const FieldError: React.FC<FieldErrorProps> = ({ message }) => {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">
      {message}
    </p>
  );
};
