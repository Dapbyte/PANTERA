import React from 'react';

interface PanteraLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showText?: boolean;
}

const LOGO_SRC = {
  light: '/logo-pantera-white.png',
  dark: '/logo-pantera-navy.png',
} as const;

export const PanteraLogo: React.FC<PanteraLogoProps> = ({
  className = 'w-10 h-10',
  variant = 'dark',
  showText = false,
}) => {
  const isLight = variant === 'light';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <img
        src={isLight ? LOGO_SRC.light : LOGO_SRC.dark}
        alt={showText ? '' : 'PANTERA'}
        draggable={false}
        className={`object-contain ${className}`}
      />
      {showText && (
        <span
          className={`font-black tracking-wider text-xl ${
            isLight ? 'text-white' : 'text-[#0B1953]'
          }`}
        >
          PANTERA
        </span>
      )}
    </div>
  );
};
