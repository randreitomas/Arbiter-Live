import type { Claim, Verdict, VerdictDecision } from '@/types';

interface JudgePanelProps {
  claims: Claim[];
  verdict: Verdict | null;
  onReviewActions: () => void;
  showReviewButton?: boolean;
}

function claimStatusIcon(status: Claim['status']) {
  switch (status) {
    case 'valid':
      return { icon: '✓', label: 'VALID', color: '#4ade80' };
    case 'concede':
      return { icon: '~', label: 'CONCEDED', color: '#f59e0b' };
    case 'struck':
      return { icon: '✗', label: 'STRUCK', color: '#f87171' };
  }
}

function verdictColor(decision: VerdictDecision) {
  switch (decision) {
    case 'REAL INCIDENT':
      return '#f87171';
    case 'FALSE POSITIVE':
      return '#4ade80';
    case 'INVESTIGATE':
      return '#f59e0b';
  }
}

export function JudgePanel({ claims, verdict, onReviewActions, showReviewButton = true }: JudgePanelProps) {
  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <h2 className="text-[8px] text-amber tracking-widest mb-2">CLAIM VALIDATION</h2>
        <div className="space-y-1.5">
          {claims.length === 0 && (
            <p className="text-[7px] text-muted">Awaiting claim submissions...</p>
          )}
          {claims.map((claim) => {
            const { icon, label, color } = claimStatusIcon(claim.status);
            return (
              <div
                key={claim.id}
                className="claim-item border border-border bg-surface px-2 py-1.5"
                aria-label={`Claim ${claim.id}: ${claim.text}, status ${label}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[7px] text-amber">{claim.id}</span>
                  <span className="text-[6px]" style={{ color }}>
                    {icon} {label}
                  </span>
                </div>
                <p className="text-[7px] text-muted leading-relaxed">{claim.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {verdict && (
        <div
          className="shrink-0 border bg-surface p-2"
          style={{ borderColor: verdictColor(verdict.decision) }}
          aria-label={`Verdict: ${verdict.decision}`}
        >
          <p className="text-[7px] text-muted mb-1 tracking-widest">VERDICT</p>
          <p
            className="text-[9px] mb-2 tracking-wide"
            style={{ color: verdictColor(verdict.decision) }}
          >
            {verdict.decision}
          </p>
          <div className="flex gap-3 mb-2">
            <span className="text-[7px] text-body">
              SEV: <span className="text-bright">{verdict.severity}</span>
            </span>
            <span className="text-[7px] text-body">
              CONF: <span className="text-bright">{verdict.confidence}</span>
            </span>
          </div>
          <ul className="space-y-1 mb-2">
            {verdict.reasoning.map((r, i) => (
              <li key={i} className="text-[6px] text-muted leading-relaxed flex gap-1">
                <span className="text-amber shrink-0">›</span>
                {r}
              </li>
            ))}
          </ul>
          {showReviewButton && (
            <button
              type="button"
              onClick={onReviewActions}
              className="w-full text-[7px] text-amber border border-amber/50 py-1.5 hover:bg-amber/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber tracking-wide"
              aria-label="Review recommended actions and approve or reject"
            >
              → REVIEW ACTIONS
            </button>
          )}
        </div>
      )}
    </div>
  );
}
