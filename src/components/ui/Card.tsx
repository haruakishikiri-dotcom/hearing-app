import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-white rounded-2xl shadow-soft p-5 ${className}`}>{children}</div>
  );
}
