interface ClosedBannerProps {
  outcome: 'approved' | 'rejected';
  timestamp: string;
  onNewCase: () => void;
}

export function ClosedBanner({ outcome, timestamp, onNewCase }: ClosedBannerProps) {
  const approved = outcome === 'approved';

  return (
    <div
      className={`flex items-center justify-between panel px-4 py-3 shrink-0 ${
        approved ? 'border-green/40 bg-green/5' : 'border-red/40 bg-red/5'
      }`}
      style={{ borderWidth: '1px' }}
      role="status"
    >
      <div>
        <p className={`text-xs font-semibold mb-0.5 ${approved ? 'text-green' : 'text-red'}`}>
          {approved ? '✓ Case closed — investigation complete' : '✗ Actions rejected — no changes executed'}
        </p>
        <p className="text-[10px] text-muted">
          {timestamp} ·{' '}
          {approved
            ? 'Remediation actions approved and queued'
            : 'No changes executed — flagged for manual review'}
        </p>
      </div>
      <button
        type="button"
        onClick={onNewCase}
        className="text-xs font-medium text-amber border border-amber/40 px-4 py-1.5 rounded-lg hover:bg-amber/10 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber shrink-0 ml-4"
      >
        ↺ New Case
      </button>
    </div>
  );
}
