import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Evidence } from '@/types';

interface EvidencePanelProps {
  evidence: Evidence[];
  highlightedIds: string[];
}

function confidencePct(conf: number): string {
  return `${Math.round(conf * 100)}%`;
}

function EvidenceCard({ item, highlighted }: { item: Evidence; highlighted: boolean }) {
  return (
    <div
      className={`ev-card ${highlighted ? 'highlighted' : ''}`}
      aria-label={`Evidence ${item.evidence_id}: ${item.fact}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <Tag variant="amber">{item.evidence_id}</Tag>
        <span className="text-[10px] text-muted shrink-0">
          {item.source_type} · {confidencePct(item.confidence)}
        </span>
      </div>
      <p className="text-xs text-body leading-relaxed">{item.fact}</p>
      {item.citedBy.length > 0 && (
        <p className="text-[10px] text-muted/60 mt-1.5">
          Cited by: {item.citedBy.join(', ')}
        </p>
      )}
    </div>
  );
}

export function EvidencePanel({ evidence, highlightedIds }: EvidencePanelProps) {
  return (
    <Panel
      title="Evidence Bundle"
      titleRight={
        evidence.length > 0 ? (
          <span className="text-[10px] text-muted">{evidence.length} items</span>
        ) : undefined
      }
      className="h-full"
      contentClassName="p-3 space-y-2 overflow-y-auto"
    >
      {evidence.length === 0 ? (
        <EmptyState icon="🔍" message="Awaiting evidence" sub="Triage agent collects first" />
      ) : (
        evidence.map((item) => (
          <EvidenceCard
            key={item.evidence_id}
            item={item}
            highlighted={highlightedIds.includes(item.evidence_id)}
          />
        ))
      )}
    </Panel>
  );
}
