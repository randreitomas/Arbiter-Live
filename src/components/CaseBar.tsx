import { StatusDot } from '@/components/ui/StatusDot';

interface CaseBarProps {
  caseId: string;
  alertName: string;
  statusLabel: string;
  statusColor: string;
}

function colorToDot(hex: string): 'amber' | 'red' | 'green' | 'blue' | 'muted' {
  if (hex.includes('f59e') || hex.includes('d97') || hex.includes('f0a')) return 'amber';
  if (hex.includes('f85') || hex.includes('f87')) return 'red';
  if (hex.includes('3fb') || hex.includes('4ad')) return 'green';
  if (hex.includes('58a') || hex.includes('60a')) return 'blue';
  return 'muted';
}

export function CaseBar({ caseId, alertName, statusLabel, statusColor }: CaseBarProps) {
  return (
    <div className="panel flex items-center justify-between px-4 py-2.5 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[11px] font-semibold text-bright shrink-0">
          Case {caseId ? `#${caseId}` : '—'}
        </span>
        {alertName && (
          <>
            <span className="text-border-2 text-xs">·</span>
            <span className="text-xs text-muted truncate">{alertName}</span>
          </>
        )}
        {!alertName && (
          <span className="text-xs text-muted">No active case</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusDot color={colorToDot(statusColor)} pulse />
        <span className="text-[11px] font-medium" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
