interface EmptyStateProps {
  icon?: string;
  message: string;
  sub?: string;
}

export function EmptyState({ icon = '—', message, sub }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
      <span className="text-2xl text-border-2 select-none">{icon}</span>
      <p className="text-[11px] font-medium text-muted tracking-wide uppercase">{message}</p>
      {sub && <p className="text-[10px] text-muted/60">{sub}</p>}
    </div>
  );
}
