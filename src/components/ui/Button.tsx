import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-soft',
  secondary:
    'bg-white text-ink-900 border border-ink-300 hover:bg-ink-100',
  ghost:
    'bg-transparent text-ink-700 hover:bg-ink-100',
  danger:
    'bg-red-600 text-white hover:bg-red-700',
};

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
