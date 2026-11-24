import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} aria-hidden="true" />
);

export const SkeletonCards: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3"
      >
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-7 w-32" />
        <SkeletonBox className="h-3 w-40" />
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols }).map((_, idx) => (
        <SkeletonBox key={idx} className="h-3.5" />
      ))}
    </div>
    <div className="space-y-3 pt-2 border-t border-gray-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="grid gap-3 items-center"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <SkeletonBox key={cIdx} className={cIdx === 1 ? 'h-5' : 'h-4'} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    <SkeletonCards count={4} />
    <SkeletonTable rows={5} cols={6} />
  </div>
);

export const SkeletonWeather: React.FC = () => (
  <div className="space-y-3">
    <SkeletonBox className="h-24 w-full rounded-2xl" />
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
      {Array.from({ length: 7 }).map((_, idx) => (
        <SkeletonBox key={idx} className="h-24 rounded-2xl" />
      ))}
    </div>
  </div>
);
