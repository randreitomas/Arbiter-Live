import { useEffect, useState } from 'react';
import { SectionEyebrow } from './SectionEyebrow';

interface PipelineAgent {
  step: number;
  role: string;
  color: string;
  name: string;
  description: string;
  frameworks: string[];
  models: string[];
  constraint: string;
}

const pipelineAgents: PipelineAgent[] = [
  {
    step: 1,
    role: 'TRIAGE',
    color: '#60a5fa',
    name: 'Triage',
    description: 'Enriches the raw alert. Builds the evidence bundle.',
    frameworks: ['LangChain'],
    models: ['Claude Haiku'],
    constraint: 'Only agent allowed to introduce evidence.',
  },
  {
    step: 2,
    role: 'PROSECUTOR',
    color: '#f87171',
    name: 'Prosecutor',
    description: 'Argues the alert is a real incident. Cites evidence IDs.',
    frameworks: ['CrewAI'],
    models: ['Claude Sonnet'],
    constraint: 'Every claim must cite a specific evidence ID.',
  },
  {
    step: 3,
    role: 'DEFENDER',
    color: '#4ade80',
    name: 'Defender',
    description: 'Argues the alert is a false positive. Challenges prosecutor claims.',
    frameworks: ['LangChain', 'Featherless'],
    models: ['Qwen3-32B'],
    constraint: 'Cannot concede without citing counter-evidence.',
  },
  {
    step: 4,
    role: 'JUDGE',
    color: '#f59e0b',
    name: 'Judge',
    description: 'Validates citations, scores severity, issues verdict.',
    frameworks: ['Band SDK'],
    models: ['GPT-4o'],
    constraint: 'Escalates to human when confidence < threshold.',
  },
];

const VERDICT_STATES = [
  { label: 'REAL INCIDENT', color: '#f87171', meta: 'HIGH · 87% confidence' },
  { label: 'FALSE POSITIVE', color: '#4ade80', meta: 'LOW · 94% confidence' },
  { label: 'INVESTIGATE', color: '#f59e0b', meta: 'MEDIUM · 61% confidence' },
];

function PipelineCard({ agent }: { agent: PipelineAgent }) {
  return (
    <div className="pipeline-card" style={{ borderLeftColor: agent.color }}>
      <p className="mb-3">
        <span className="pipeline-step-index">{agent.step}</span>
        <span className="label-text"> · </span>
        <span className="card-heading" style={{ color: agent.color }}>
          {agent.role}
        </span>
      </p>
      <p className="pipeline-agent-name">{agent.name}</p>
      <p className="body-text mb-3">{agent.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {agent.frameworks.map((f) => (
          <span key={f} className="tech-pill">[ {f} ]</span>
        ))}
        {agent.models.map((m) => (
          <span key={m} className="tech-pill">[ {m} ]</span>
        ))}
      </div>
      <p className="label-text text-amber mb-1">KEY CONSTRAINT:</p>
      <p className="body-text">{agent.constraint}</p>
    </div>
  );
}

function DebateConnector() {
  return (
    <div className="flex flex-col items-center justify-center px-0.5 self-center shrink-0">
      <svg width="28" height="16" viewBox="0 0 40 16" aria-hidden="true" className="text-border">
        <line x1="4" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="14,8 10,5 10,11" fill="currentColor" />
        <line x1="26" y1="8" x2="36" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="26,8 30,5 30,11" fill="currentColor" />
      </svg>
    </div>
  );
}

function VerdictNode() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % VERDICT_STATES.length), 3000);
    return () => clearInterval(id);
  }, []);

  const verdict = VERDICT_STATES[idx];

  return (
    <div className="verdict-output-chip">
      <p className="label-text mb-3">OUTPUT</p>
      <p
        className="pipeline-agent-name mb-2 transition-colors duration-300"
        style={{ color: verdict.color }}
      >
        {verdict.label}
      </p>
      <p className="body-text mb-4">{verdict.meta}</p>
      <p className="label-text text-green">+ full audit trail</p>
      <p className="label-text text-green">+ human approval gate</p>
    </div>
  );
}

function Arrow({ direction = 'right' }: { direction?: 'right' | 'down' }) {
  return (
    <span className={`pipeline-arrow ${direction === 'down' ? 'block text-center py-2' : ''}`} aria-hidden="true">
      {direction === 'down' ? '↓' : '→'}
    </span>
  );
}

function AlertTrigger() {
  return (
    <div className="text-center mb-8">
      <p className="label-text">[ ALERT RECEIVED ]</p>
      <p className="pipeline-arrow block py-2">↓</p>
    </div>
  );
}

function DesktopPipeline() {
  const [triage, prosecutor, defender, judge] = pipelineAgents;

  return (
    <div className="hidden xl:block pipeline-flow">
      <AlertTrigger />
      <div className="flex items-stretch gap-1 pipeline-flow">
        <div className="flex-[1_1_0] min-w-0">
          <PipelineCard agent={triage} />
        </div>
        <Arrow />
        <div className="pipeline-debate-group flex flex-col items-center">
          <div className="pipeline-debate-row w-full">
            <PipelineCard agent={prosecutor} />
            <DebateConnector />
            <PipelineCard agent={defender} />
          </div>
          <p className="label-text mt-3">adversarial debate</p>
        </div>
        <Arrow />
        <div className="flex-[1_1_0] min-w-0">
          <PipelineCard agent={judge} />
        </div>
        <Arrow />
        <VerdictNode />
      </div>
    </div>
  );
}

function MobilePipeline() {
  return (
    <div className="xl:hidden pipeline-flow">
      <AlertTrigger />
      <div className="flex flex-col items-stretch w-full max-w-md mx-auto">
        <PipelineCard agent={pipelineAgents[0]} />
        <Arrow direction="down" />

        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <PipelineCard agent={pipelineAgents[1]} />
            <PipelineCard agent={pipelineAgents[2]} />
          </div>
          <p className="label-text text-center mt-2 mb-2">adversarial debate</p>
        </div>
        <Arrow direction="down" />

        <PipelineCard agent={pipelineAgents[3]} />
        <Arrow direction="down" />
        <VerdictNode />
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border overflow-hidden">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <SectionEyebrow>[ HOW IT WORKS ]</SectionEyebrow>
        <h2 className="section-heading">From alert to verdict.</h2>
        <p className="section-subhead">
          Five specialized agents process each alert through an adversarial pipeline — evidence first, debate second, judgment last.
        </p>
      </div>

      <DesktopPipeline />
      <MobilePipeline />

      <p className="body-text text-center max-w-2xl mx-auto mt-12">
        The debate is adversarial by design. Arbiter can&apos;t short-circuit to a verdict — it has to argue its way there.
      </p>
    </section>
  );
}
