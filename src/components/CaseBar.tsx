interface CaseBarProps {
  caseId: string;
  alertName: string;
  statusLabel: string;
  statusColor: string;
}

export function CaseBar({ caseId, alertName, statusLabel, statusColor }: CaseBarProps) {
  return (
    <div className="flex items-center justify-between border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[8px] text-bright tracking-wide">
          CASE #{caseId || '---'}
        </span>
        <span className="text-[7px] text-muted">|</span>
        <span className="text-[7px] text-body tracking-wide">{alertName || 'NO ACTIVE CASE'}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="status-dot w-2 h-2 rounded-full animate-blink"
          style={{ backgroundColor: statusColor }}
          aria-hidden="true"
        />
        <span
          className="text-[7px] tracking-widest"
          style={{ color: statusColor }}
          aria-label={`Case status: ${statusLabel}`}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
