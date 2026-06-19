type DotColor = 'amber' | 'red' | 'green' | 'blue' | 'muted';

interface StatusDotProps {
  color?: DotColor;
  pulse?: boolean;
  className?: string;
}

const DOT_COLORS: Record<DotColor, string> = {
  amber: 'bg-amber',
  red:   'bg-red',
  green: 'bg-green',
  blue:  'bg-blue',
  muted: 'bg-muted',
};

export function StatusDot({ color = 'muted', pulse = false, className = '' }: StatusDotProps) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[color]} ${pulse ? 'animate-blink' : ''} ${className}`}
    />
  );
}
