import type { Evidence } from '@/types';

interface EvidencePanelProps {
  evidence: Evidence[];
  highlightedIds: string[];
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
          const highlighted = highlightedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`evidence-item border px-2 py-1.5 transition-colors duration-300 ${
                highlighted
                  ? 'border-amber bg-amber/10'
                  : 'border-border bg-surface'
              }`}
              aria-label={`Evidence ${item.id}: ${item.text}`}
            >
              <span className="text-[7px] text-amber block mb-1">{item.id}</span>
              <p className="text-[7px] text-muted leading-relaxed">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
