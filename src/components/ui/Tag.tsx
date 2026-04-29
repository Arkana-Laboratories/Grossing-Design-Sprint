import type { ReactNode } from 'react';

type TagVariant = 'neutral' | 'warning' | 'danger' | 'info' | 'success';

interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
}

const variantClasses: Record<TagVariant, string> = {
  neutral: 'bg-arkana-gray-50 text-arkana-black border border-arkana-gray-200',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-arkana-red-light text-arkana-red-dark',
  info: 'bg-arkana-blue-light text-arkana-blue',
  success: 'bg-arkana-green-light text-arkana-green',
};

export function Tag({ variant = 'neutral', children }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
