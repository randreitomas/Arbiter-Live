import { useEffect, useRef, useState } from 'react';

interface FeedLine {
  text: string;
  variant: 'default' | 'verdict';
  pauseBefore?: number;
}

const FEED_LINES: FeedLine[] = [
  { text: '[TRIAGE]      09:01:22   Alert received from CrowdStrike Falcon.', variant: 'default' },
  { text: '[TRIAGE]      09:01:25   Enriching host: FINANCE-SRV-01 (Tier 1 Critical)', variant: 'default' },
  { text: '[TRIAGE]      09:01:28   Evidence bundle sealed. 7 items. EV-001 → EV-007.', variant: 'default' },
  { text: '[PROSECUTOR]  09:01:32   P-001: mimikatz.exe accessed lsass.exe. [EV-001][EV-005]', variant: 'default' },
  { text: '[PROSECUTOR]  09:01:35   P-002: FINANCE-SRV-01 is Tier 1. Blast radius: CRITICAL.', variant: 'default' },
  { text: '[DEFENDER]    09:01:40   D-001: svc_backup account may explain LSASS access. [EV-004]', variant: 'default' },
  { text: '[DEFENDER]    09:01:43   D-002: No maintenance window in CMDB. Conceded. [EV-006]', variant: 'default' },
  { text: '[JUDGE]       09:01:55   Claims validated. Defender concessions noted.', variant: 'default', pauseBefore: 700 },
  { text: '                         Confidence: 87%. Issuing verdict...', variant: 'default' },
  { text: 'VERDICT: REAL INCIDENT  ·  SEVERITY: HIGH  ·  CONFIDENCE: 87%', variant: 'verdict' },
];

const AGENT_COLORS: Record<string, string> = {
  TRIAGE:     '#58a6ff',
  PROSECUTOR: '#f85149',
  DEFENDER:   '#3fb950',
  JUDGE:      '#f59e0b',
};

interface ParsedLine {
  kind: 'agent' | 'continuation' | 'verdict';
  agent?: string;
  time?: string;
  message: string;
}

function parseLine(text: string, variant: FeedLine['variant']): ParsedLine {
  if (variant === 'verdict' || text.startsWith('VERDICT:')) {
    return { kind: 'verdict', message: text };
  }
  const agentMatch = text.match(/^\[(\w+)\]/);
  if (agentMatch) {
    const afterAgent = text.slice(agentMatch[0].length);
    const timeMatch = afterAgent.match(/^\s+(\d{2}:\d{2}:\d{2})\s*(.*)$/);
    if (timeMatch) {
      return { kind: 'agent', agent: agentMatch[1], time: timeMatch[1], message: timeMatch[2] };
    }
    return { kind: 'agent', agent: agentMatch[1], message: afterAgent.trim() };
  }
  return { kind: 'continuation', message: text.trim() };
}

function FeedLine({ text, variant }: { text: string; variant: FeedLine['variant'] }) {
  const parsed = parseLine(text, variant);

  if (parsed.kind === 'verdict') {
    return (
      <div className="terminal-line terminal-verdict">
        <span className="verdict-glow text-red font-bold">{parsed.message}</span>
      </div>
    );
  }

  if (parsed.kind === 'continuation') {
    return (
      <div className="terminal-line" style={{ paddingLeft: '24ch' }}>
        <span className="terminal-msg">{parsed.message}</span>
      </div>
    );
  }

  return (
    <div className="terminal-line">
      <span className="terminal-agent font-semibold" style={{ color: AGENT_COLORS[parsed.agent ?? ''] ?? '#8b949e' }}>
        [{parsed.agent}]
      </span>
      {parsed.time && <span className="terminal-time">{parsed.time}</span>}
      <span className="terminal-msg">{parsed.message}</span>
    </div>
  );
}

export function TerminalFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [completedLines, setCompletedLines] = useState<FeedLine[]>([]);
  const [typingText, setTypingText]       = useState('');
  const [typingVariant, setTypingVariant] = useState<FeedLine['variant']>('default');
  const [done, setDone]                   = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setCompletedLines(FEED_LINES); setDone(true); return; }

    let cancelled = false;
    const timeouts: number[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((res) => { const id = window.setTimeout(res, ms); timeouts.push(id); });

    async function animate() {
      for (const line of FEED_LINES) {
        if (cancelled) return;
        if (line.pauseBefore) await sleep(line.pauseBefore);
        setTypingVariant(line.variant);
        for (let i = 1; i <= line.text.length; i++) {
          if (cancelled) return;
          setTypingText(line.text.slice(0, i));
          await sleep(16);
        }
        setCompletedLines((prev) => [...prev, line]);
        setTypingText('');
      }
      setDone(true);
    }

    void animate();
    return () => { cancelled = true; timeouts.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [completedLines, typingText]);

  return (
    <div className="terminal-box">
      <div className="terminal-header">
        ARBITER · CASE #A-002 · LSASS CREDENTIAL DUMP
      </div>
      <div
        ref={scrollRef}
        className="terminal-body max-h-52 overflow-y-auto"
        aria-live="polite"
        aria-label="Simulated agent debate"
      >
        <div className="terminal-line text-border-2 mb-2 select-none">{'─'.repeat(52)}</div>
        {completedLines.map((line, i) => (
          <FeedLine key={i} text={line.text} variant={line.variant} />
        ))}
        {typingText && (
          <>
            <FeedLine text={typingText} variant={typingVariant} />
            <span className="terminal-cursor">▌</span>
          </>
        )}
        {done && !typingText && <span className="terminal-cursor">▌</span>}
      </div>
      <p className="text-[11px] text-muted px-4 py-2.5 border-t border-border">
        Simulated demo · 3 scenarios available
      </p>
    </div>
  );
}
