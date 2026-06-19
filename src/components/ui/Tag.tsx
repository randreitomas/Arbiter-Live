import type { ReactNode } from 'react';

type TagVariant = 'amber' | 'red' | 'green' | 'blue' | 'violet' | 'muted';

interface TagProps {
  children: ReactNode;
  variant?: TagVariant;
  className?: string;
}

const VARIANT_COLORS: Record<TagVariant, string> = {
  amber:  'text-amber  border-amber/40  bg-amber/5',
  red:    'text-red    border-red/40    bg-red/5',
  green:  'text-green  border-green/40  bg-green/5',
  blue:   'text-blue   border-blue/40   bg-blue/5',
  violet: 'text-violet border-violet/40 bg-violet/5',
  muted:  'text-muted  border-border-2  bg-surface-2',
};

export function Tag({ children, variant = 'muted', className = '' }: TagProps) {
  return (
    <span className={`tag ${VARIANT_COLORS[variant]} ${className}`}>
      {children}
    </span>
  );
}
