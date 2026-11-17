import React from 'react';

interface PanteraLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showText?: boolean;
}

export const PanteraLogo: React.FC<PanteraLogoProps> = ({
  className = 'w-10 h-10',
  variant = 'dark',
  showText = false,
}) => {
  const isLight = variant === 'light';
  const fillColor = isLight ? '#FFFFFF' : '#0B1953';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Stylized Panther 'P' Icon */}
        <path
          d="M26 18C44 18 64 24 64 42C64 54 54 62 42 63C38 63 34 62 30 60V84H18V24C18 20 21 18 26 18Z"
          fill={fillColor}
        />
        <path
          d="M52 24C65 24 78 33 78 46C78 52 74 58 68 62C72 59 75 54 75 48C75 38 65 30 54 28L52 24Z"
          fill={fillColor}
        />
        <path
          d="M48 34C54 34 60 38 60 44C60 48 57 51 53 52C56 50 58 47 58 44C58 40 53 37 48 37V34Z"
          fill={isLight ? '#1877F2' : '#FFFFFF'}
        />
        <circle cx="50" cy="38" r="2.5" fill={isLight ? '#1877F2' : '#FFFFFF'} />
      </svg>
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
