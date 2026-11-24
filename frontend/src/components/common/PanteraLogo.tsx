import React from 'react';

interface PanteraLogoProps {
  className?: string;
  textClassName?: string;
  variant?: 'light' | 'dark';
  showText?: boolean;
}

const LOGO_SRC = {
  light: '/logo-pantera-white.png',
  dark: '/logo-pantera-navy.png',
} as const;

export const PanteraLogo: React.FC<PanteraLogoProps> = ({
  className = 'w-10 h-10',
  textClassName = 'text-xl',
  variant = 'dark',
  showText = false,
}) => {
  const isLight = variant === 'light';

  return (
    <div className="inline-flex items-center gap-1 select-none" aria-label="PANTERA">
      <img
        src={isLight ? LOGO_SRC.light : LOGO_SRC.dark}
        alt={showText ? 'P' : 'PANTERA'}
        draggable={false}
        className={`object-contain shrink-0 ${className}`}
      />
      {showText && (
        <span
          className={`font-black tracking-[0.14em] leading-none ${textClassName} ${
            isLight ? 'text-white' : 'text-[#0B1953]'
          }`}
        >
          ANTERA
        </span>
      )}
    </div>
  );
};
