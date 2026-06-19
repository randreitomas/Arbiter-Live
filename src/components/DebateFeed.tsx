import { useEffect, useRef } from 'react';
import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Tag';
import { StatusDot } from '@/components/ui/StatusDot';
import type { AgentMessage } from '@/types';
import { AGENT_COLORS, AGENT_LABELS } from '@/types';

interface DebateFeedProps {
  messages: AgentMessage[];
  isTyping: boolean;
  onEvidenceClick?: (id: string) => void;
}

type TagVariant = 'amber' | 'red' | 'green' | 'blue' | 'violet' | 'muted';

function agentTagVariant(color: string): TagVariant {
  if (color.includes('f85') || color.includes('f87')) return 'red';
  if (color.includes('3fb') || color.includes('4ad')) return 'green';
  if (color.includes('f59') || color.includes('f0a')) return 'amber';
  if (color.includes('58a') || color.includes('60a')) return 'blue';
  return 'muted';
}

export function DebateFeed({ messages, isTyping, onEvidenceClick }: DebateFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <Panel title="Debate Feed" className="flex-1 min-h-0 h-full" contentClassName="overflow-y-auto">
      <div
        className="p-3 space-y-2"
        aria-live="polite"
        aria-label="Agent debate messages"
      >
        {messages.map((msg, i) => {
          const color = AGENT_COLORS[msg.agent];
          const variant = agentTagVariant(color);
          return (
            <div
              key={`${msg.id ?? msg.timestamp}-${i}`}
              className="msg-card"
              style={{ borderLeftColor: color }}
              aria-label={`${AGENT_LABELS[msg.agent]} at ${msg.timestamp}: ${msg.text}`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Tag variant={variant}>{AGENT_LABELS[msg.agent]}</Tag>
                <span className="text-[10px] text-muted">{msg.timestamp}</span>
                {msg.type && (
                  <span className="text-[10px] text-muted capitalize">{msg.type}</span>
                )}
                {msg.mitre.length > 0 && (
                  <Tag variant="violet">{msg.mitre.join(' · ')}</Tag>
                )}
              </div>
              <p className="text-xs text-body leading-relaxed whitespace-pre-wrap mb-2">{msg.text}</p>
              {msg.evidenceCited.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.evidenceCited.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onEvidenceClick?.(id)}
                      className="tag text-amber border-amber/40 bg-amber/5 cursor-pointer hover:bg-amber/15 transition-colors"
                      aria-label={`View evidence ${id}`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 panel border-border-2"
            style={{ borderRadius: '6px' }}
            aria-label="Agent processing"
          >
            <StatusDot color="amber" pulse />
            <span className="text-xs text-muted">Agent processing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </Panel>
  );
}
