import { useEffect, useRef, useState } from 'react';

interface Step {
  step: number;
  role: string;
  color: string;
  name: string;
  description: string;
  tags: string[];
}

const STEPS: Step[] = [
  {
    step: 1,
    role: 'TRIAGE',
    color: '#58a6ff',
    name: 'Triage',
    description: 'Receives the raw alert and enriches it — host lookup, CMDB, MITRE mapping. Seals the evidence bundle. No other agent can modify it.',
    tags: ['LangChain', 'Claude Haiku'],
  },
  {
    step: 2,
    role: 'PROSECUTOR',
    color: '#f85149',
    name: 'Prosecutor',
    description: 'Argues the alert is a real incident. Every claim must cite a specific evidence ID. Cannot fabricate.',
    tags: ['CrewAI', 'Claude Sonnet'],
  },
  {
    step: 3,
    role: 'DEFENDER',
    color: '#3fb950',
    name: 'Defender',
    description: 'Argues false positive. Surfaces exculpatory evidence and challenges Prosecutor claims. Can force concessions.',
    tags: ['LangChain', 'Qwen3-32B'],
  },
  {
    step: 4,
    role: 'JUDGE',
    color: '#f59e0b',
    name: 'Judge',
    description: 'Validates every citation, scores severity and confidence, issues a final verdict. Escalates to human when confidence is below threshold.',
    tags: ['Band SDK', 'GPT-4o'],
  },
];

const VERDICT_STATES = [
  { label: 'REAL INCIDENT', color: '#f85149' },
  { label: 'FALSE POSITIVE', color: '#3fb950' },
  { label: 'INVESTIGATE',    color: '#f59e0b' },
];

function StepCard({ step, visible, delay }: { step: Step; visible: boolean; delay: number }) {
  return (
    <div
      className="step-card flex gap-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      <div className="flex-shrink-0 flex flex-col items-center pt-0.5">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-bg flex-shrink-0"
          style={{ background: step.color }}
        >
          {step.step}
        </span>
        {step.step < STEPS.length && (
          <div className="w-px flex-1 mt-2" style={{ background: `${step.color}30` }} />
        )}
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold tracking-widest" style={{ color: step.color }}>
            {step.role}
          </span>
        </div>
        <p className="text-[15px] font-semibold text-bright mb-2">{step.name}</p>
        <p className="text-[13px] text-muted leading-relaxed mb-3">{step.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {step.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded border border-border-2 text-muted bg-surface-2"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerdictBox({ visible }: { visible: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % VERDICT_STATES.length), 2500);
    return () => clearInterval(id);
  }, [visible]);

  const v = VERDICT_STATES[idx];

  return (
    <div
      className="panel p-5 text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease 400ms, transform 0.5s ease 400ms',
        borderColor: v.color + '60',
      }}
    >
      <p className="text-[10px] text-muted tracking-widest uppercase mb-3">Verdict Output</p>
      <p
        className="text-[18px] font-bold mb-1 transition-colors duration-500"
        style={{ color: v.color }}
      >
        {v.label}
      </p>
      <p className="text-[11px] text-muted mt-3">+ full audit trail</p>
      <p className="text-[11px] text-muted">+ human approval gate</p>
    </div>
  );
}

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-5 sm:px-8 max-w-5xl mx-auto border-t border-border">
      <div className="text-center max-w-xl mx-auto mb-14">
        <p className="hero-eyebrow mb-4">How it works</p>
        <h2 className="section-heading mb-4">From alert to verdict.</h2>
        <p className="section-subhead">
          Five specialized agents process each alert through an adversarial pipeline —
          evidence first, debate second, judgment last.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">
        <div>
          {STEPS.map((s, i) => (
            <StepCard key={s.role} step={s} visible={visible} delay={i * 80} />
          ))}
        </div>
        <VerdictBox visible={visible} />
      </div>
    </section>
  );
}
