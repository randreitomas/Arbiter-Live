import { useScrollReveal } from '@/hooks/useScrollReveal';

interface SectionEyebrowProps {
  children: string;
  className?: string;
}

export function SectionEyebrow({ children, className = '' }: SectionEyebrowProps) {
  const { ref, visible } = useScrollReveal();
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = visible || reduced;

  return (
    <p
      ref={ref}
      className={`section-eyebrow transition-all duration-500 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${className}`}
    >
      {children}
    </p>
  );
}
