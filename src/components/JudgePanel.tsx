import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Claim, Verdict } from '@/types';
import { VERDICT_LABELS, VERDICT_COLORS } from '@/types';

interface JudgePanelProps {
  claims: Claim[];
  verdict: Verdict | null;
  onReviewActions: () => void;
  showReviewButton?: boolean;
}

function claimStatusProps(status: Claim['status']) {
  switch (status) {
    case 'valid':   return { label: 'Valid',     variant: 'green'  as const, icon: '✓' };
    case 'concede': return { label: 'Conceded',  variant: 'amber'  as const, icon: '~' };
    case 'struck':  return { label: 'Struck',    variant: 'red'    as const, icon: '✗' };
  }
}

function severityColor(sev: Verdict['severity']): string {
  switch (sev) {
    case 'critical': return '#f85149';
    case 'high':     return '#fb923c';
    case 'medium':   return '#f59e0b';
    case 'low':      return '#3fb950';
    default:         return '#8b949e';
  }
}

function ClaimCard({ claim }: { claim: Claim }) {
  const { label, variant, icon } = claimStatusProps(claim.status);
  return (
    <div className="claim-card" aria-label={`Claim ${claim.id}: ${claim.text}, status ${label}`}>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <Tag variant="amber">{claim.id}</Tag>
        <span className="text-[10px] text-muted">{claim.agent}</span>
        <Tag variant={variant}>{icon} {label}</Tag>
      </div>
      <p className="text-xs text-body leading-relaxed">{claim.text}</p>
    </div>
  );
}

function VerdictCard({ verdict, onReviewActions, showReviewButton }: {
  verdict: Verdict;
  onReviewActions: () => void;
  showReviewButton: boolean;
}) {
  const color = VERDICT_COLORS[verdict.decision];
  const label = VERDICT_LABELS[verdict.decision];

  return (
    <div className="verdict-card" style={{ borderColor: color + '60', background: color + '08' }}>
      <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Verdict</p>
      <p className="text-sm font-bold mb-2" style={{ color }}>{label}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {verdict.severity && (
          <span className="text-xs text-body">
            Severity: <span className="font-medium" style={{ color: severityColor(verdict.severity) }}>
              {verdict.severity}
            </span>
          </span>
        )}
        <span className="text-xs text-body">
          Confidence: <span className="font-medium text-bright">
            {verdict.confidence.replace('_', ' ')}
          </span>
        </span>
      </div>

      <div className="max-h-28 overflow-y-auto mb-3">
        <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{verdict.reasoning}</p>
      </div>

      {verdict.impliedActions && (
        <div className="border border-amber/20 bg-amber/5 rounded px-3 py-2 mb-3">
          <p className="text-[10px] text-amber mb-1 tracking-wide uppercase">Implied Actions</p>
          <p className="text-xs text-muted leading-relaxed">{verdict.impliedActions}</p>
        </div>
      )}

      {showReviewButton && (
        <button
          type="button"
          onClick={onReviewActions}
          className="w-full text-xs font-medium text-amber border border-amber/40 py-2 rounded hover:bg-amber/10 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
        >
          Review &amp; Approve →
        </button>
      )}
    </div>
  );
}

export function JudgePanel({ claims, verdict, onReviewActions, showReviewButton = true }: JudgePanelProps) {
  return (
    <Panel title="Judge" className="h-full" contentClassName="p-3 flex flex-col gap-3 overflow-hidden">
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
        <p className="text-[10px] text-muted uppercase tracking-widest">Claims</p>
        {claims.length === 0 ? (
          <EmptyState icon="⚖️" message="No claims yet" sub="Counsel will submit claims during debate" />
        ) : (
          claims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)
        )}
      </div>

      {verdict && (
        <VerdictCard
          verdict={verdict}
          onReviewActions={onReviewActions}
          showReviewButton={showReviewButton}
        />
      )}
    </Panel>
  );
}
