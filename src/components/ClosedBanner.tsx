interface ClosedBannerProps {
  outcome: 'approved' | 'rejected';
  timestamp: string;
  onNewCase: () => void;
}

export function ClosedBanner({ outcome, timestamp, onNewCase }: ClosedBannerProps) {
  const approved = outcome === 'approved';

  return (
    <div
      className={`flex items-center justify-between border px-3 py-2 mt-2 ${
        approved ? 'border-green bg-green/5' : 'border-red bg-red/5'
      }`}
      role="status"
      aria-label={approved ? 'Case closed' : 'Actions rejected'}
    >
      <div>
        <p
          className={`text-[8px] tracking-wide mb-0.5 ${approved ? 'text-green' : 'text-red'}`}
        >
          {approved
            ? '✓ CASE CLOSED — INVESTIGATION COMPLETE'
            : '✗ ACTIONS REJECTED — NO CHANGES EXECUTED'}
        </p>
        <p className="text-[6px] text-muted">
          {timestamp} · Analyst: auto-adjudication pipeline ·{' '}
          {approved
            ? 'Remediation actions approved and queued'
            : 'No changes executed — case flagged for manual review'}
        </p>
      </div>
      <button
        type="button"
        onClick={onNewCase}
        className="text-[7px] text-amber border border-amber/50 px-3 py-1.5 hover:bg-amber/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber tracking-wide shrink-0 ml-4"
        aria-label="Start new case"
      >
        ↺ NEW CASE
      </button>
    </div>
  );
}
