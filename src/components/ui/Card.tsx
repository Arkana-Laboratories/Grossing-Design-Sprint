import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Card({ title, className = '', children }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-slate-700 mb-3 uppercase tracking-wide">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
