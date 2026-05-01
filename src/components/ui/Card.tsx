import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  className?: string;
  noPad?: boolean;
  children: ReactNode;
}

export function Card({ title, className = '', noPad = false, children }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${noPad ? '' : 'p-5'} ${className}`}>
      {title && (
        <h3 className={`text-sm font-medium text-slate-700 uppercase tracking-wide ${noPad ? 'px-5 pt-4 pb-3' : 'mb-3'}`}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
