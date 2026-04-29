import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

// Per Arkana brand: button labels = Montserrat Bold (700).
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-arkana-red text-white hover:bg-arkana-red-dark disabled:bg-arkana-gray-200 disabled:text-arkana-gray-500',
  secondary:
    'bg-white text-arkana-black border border-arkana-gray-200 hover:border-arkana-gray-500 hover:bg-arkana-gray-50',
  ghost: 'bg-transparent text-arkana-black hover:bg-arkana-gray-50',
};

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-4 text-sm',
  lg: 'h-14 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-bold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arkana-red focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
