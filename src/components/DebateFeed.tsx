import { useEffect, useRef } from 'react';
import type { AgentMessage } from '@/types';
import { AGENT_COLORS, AGENT_LABELS } from '@/types';

interface DebateFeedProps {
  messages: AgentMessage[];
  isTyping: boolean;
  onEvidenceClick?: (id: string) => void;
}

export function DebateFeed({ messages, isTyping, onEvidenceClick }: DebateFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col min-h-0">
      <h2 className="text-[8px] text-amber tracking-widest mb-2 shrink-0">AGENT DEBATE FEED</h2>
      <div
        className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1 min-h-0"
        aria-live="polite"
        aria-label="Agent debate messages"
      >
        {messages.map((msg, i) => (
          <div
            key={`${msg.id ?? msg.timestamp}-${i}`}
            className="debate-message border border-border bg-surface px-2 py-1.5"
            style={{ borderLeftWidth: '3px', borderLeftColor: AGENT_COLORS[msg.agent] }}
            aria-label={`${AGENT_LABELS[msg.agent]} at ${msg.timestamp}: ${msg.text}`}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[7px] tracking-wide"
                style={{ color: AGENT_COLORS[msg.agent] }}
              >
                [{AGENT_LABELS[msg.agent]}]
              </span>
              <span className="text-[6px] text-muted">{msg.timestamp}</span>
              {msg.type && (
                <span className="text-[6px] text-muted uppercase">· {msg.type}</span>
              )}
              {msg.mitre.length > 0 && (
                <span className="text-[6px] text-amber border border-amber/40 px-1">
                  {msg.mitre.join(' · ')}
                </span>
              )}
            </div>
            <p className="text-[7px] text-body leading-relaxed mb-1 whitespace-pre-wrap">{msg.text}</p>
            {msg.evidenceCited.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {msg.evidenceCited.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onEvidenceClick?.(id)}
                    className="text-[6px] text-amber border border-amber/30 px-1 hover:bg-amber/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
                    aria-label={`View evidence ${id}`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div
            className="border border-border bg-surface px-2 py-1.5 animate-pulse"
            aria-label="Agent processing"
          >
            <span className="text-[7px] text-muted tracking-widest">AGENT PROCESSING...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
