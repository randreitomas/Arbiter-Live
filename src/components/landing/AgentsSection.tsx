import { useEffect, useRef, useState } from 'react';
import { SectionEyebrow } from './SectionEyebrow';

const agents = [
  {
    name: 'TRIAGE',
    color: '#60a5fa',
    framework: 'LangChain',
    model: 'Claude Haiku',
    description:
      'Receives the raw alert and enriches it: host lookup, asset criticality, CMDB check, MITRE mapping. Packages the result into a sealed evidence bundle. No other agent can add to it.',
  },
  {
    name: 'PROSECUTOR',
    color: '#f87171',
    framework: 'CrewAI',
    model: 'Claude Sonnet',
    description:
      'Argues that the alert is a real incident. Cites specific evidence IDs. Makes claims about attack patterns, blast radius, and MITRE tactics. Cannot fabricate — every claim must reference the evidence bundle.',
  },
  {
    name: 'DEFENDER',
    color: '#4ade80',
    framework: 'LangChain',
    frameworkExtra: 'Featherless',
    model: 'Qwen3-32B',
    description:
      'Argues the alert is a false positive. Challenges the Prosecutor\'s claims, surfaces exculpatory evidence (maintenance windows, known scanners, VPN usage). Can force the Prosecutor to concede if the evidence holds.',
  },
  {
    name: 'JUDGE',
    color: '#f59e0b',
    framework: 'Band SDK',
    model: 'GPT-4o',
    description:
      'Validates every citation. Scores severity and confidence. Issues one of three verdicts: REAL INCIDENT, FALSE POSITIVE, or INVESTIGATE. Escalates to a human analyst when confidence is below threshold.',
  },
];

export function AgentsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="agents" ref={sectionRef} className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <SectionEyebrow>[ THE AGENTS ]</SectionEyebrow>
        <h2 className="section-heading">Specialized roles. Adversarial by design.</h2>
        <p className="section-subhead">
          Each agent has a narrow mandate and hard constraints — no single model decides alone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent, i) => (
          <div
            key={agent.name}
            className={`agent-card bg-surface border border-border p-5 transition-all duration-500 hover:-translate-y-0.5 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
            style={{
              borderLeftWidth: '3px',
              borderLeftColor: agent.color,
              transitionDelay: visible ? `${i * 100}ms` : '0ms',
            }}
          >
            <p className="card-heading mb-3" style={{ color: agent.color }}>
              {agent.name}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="tech-pill">[ {agent.framework} ]</span>
              {'frameworkExtra' in agent && agent.frameworkExtra && (
                <span className="tech-pill">[ {agent.frameworkExtra} ]</span>
              )}
              <span className="tech-pill">[ {agent.model} ]</span>
            </div>
            <p className="body-text">{agent.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
