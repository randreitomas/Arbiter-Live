import type { Evidence } from '@/types';

interface EvidencePanelProps {
  evidence: Evidence[];
  highlightedIds: string[];
}

function confidencePct(conf: number): string {
  return `${Math.round(conf * 100)}%`;
}

export function EvidencePanel({ evidence, highlightedIds }: EvidencePanelProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="text-[8px] text-amber tracking-widest mb-3 shrink-0">EVIDENCE BUNDLE</h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {evidence.length === 0 && (
          <p className="text-[7px] text-muted leading-relaxed">Awaiting evidence collection...</p>
        )}
        {evidence.map((item) => {
          const highlighted = highlightedIds.includes(item.evidence_id);
          return (
            <div
              key={item.evidence_id}
              className={`evidence-item border px-2 py-1.5 transition-colors duration-300 ${
                highlighted
                  ? 'border-amber bg-amber/10'
                  : 'border-border bg-surface'
              }`}
              aria-label={`Evidence ${item.evidence_id}: ${item.fact}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[7px] text-amber">{item.evidence_id}</span>
                <span className="text-[6px] text-muted uppercase tracking-wide">
                  {item.source_type} · {confidencePct(item.confidence)}
                </span>
              </div>
              <p className="text-[7px] text-muted leading-relaxed">{item.fact}</p>
              {item.citedBy.length > 0 && (
                <p className="text-[6px] text-muted/60 mt-0.5">
                  cited by: {item.citedBy.join(', ')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
