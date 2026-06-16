import { SectionEyebrow } from './SectionEyebrow';

const panels = [
  {
    title: 'EVIDENCE BUNDLE',
    content: (
      <div className="space-y-1.5 terminal-text">
        <p><span className="text-amber">EV-001</span> <span className="text-landing-muted">mimikatz.exe → lsass.exe</span></p>
        <p><span className="text-amber">EV-002</span> <span className="text-landing-muted">FINANCE-SRV-01 (Tier 1)</span></p>
        <p><span className="text-amber">EV-003</span> <span className="text-landing-muted">svc_backup executing account</span></p>
        <p><span className="text-amber">EV-004</span> <span className="text-landing-muted">anomalous process lineage</span></p>
        <p><span className="text-amber">EV-005</span> <span className="text-landing-muted">no maintenance window</span></p>
        <p><span className="text-amber">EV-006</span> <span className="text-landing-muted">MITRE T1003 mapping</span></p>
        <p className="label-text pt-2 border-t border-border mt-2">7 items · sealed</p>
      </div>
    ),
    caption: 'Immutable evidence record — every claim must cite an EV-ID.',
  },
  {
    title: 'AGENT DEBATE',
    content: (
      <div className="space-y-1.5 terminal-text">
        <p><span className="text-red">[PRO]</span> <span className="text-landing-muted">P-001: credential dump on Tier 1 [EV-001]</span></p>
        <p><span className="text-green">[DEF]</span> <span className="text-landing-muted">D-001: svc_backup legitimacy [EV-003]</span></p>
        <p><span className="text-green">[DEF]</span> <span className="text-landing-muted">D-002: conceded — no maint. window [EV-005]</span></p>
        <p><span className="text-amber">[JUD]</span> <span className="text-landing-muted">Claims validated. 87% confidence.</span></p>
        <p className="label-text pt-2 border-t border-border mt-2">citation-backed</p>
      </div>
    ),
    caption: 'Full adversarial transcript — Prosecutor vs Defender with Judge oversight.',
  },
  {
    title: 'VERDICT',
    content: (
      <div className="terminal-text">
        <p className="text-red font-bold verdict-glow mb-2">REAL INCIDENT</p>
        <p className="text-landing-bright mb-3">HIGH / 87%</p>
        <ul className="space-y-1 label-text">
          <li>· mimikatz.exe confirmed on Tier 1 asset</li>
          <li>· Defender conceded no maintenance window</li>
          <li>· T1003 credential dumping validated</li>
        </ul>
        <p className="label-text pt-2 border-t border-border mt-2">audit-ready</p>
      </div>
    ),
    caption: 'Structured verdict with severity, confidence, and reasoning — ready for SOC 2 review.',
  },
];

export function OutputSection() {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <SectionEyebrow>[ THE OUTPUT ]</SectionEyebrow>
        <h2 className="section-heading">Three auditable artifacts.</h2>
        <p className="section-subhead">
          Everything Arbiter produces is citation-backed, adversarially tested, and ready for compliance review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {panels.map((panel) => (
          <div key={panel.title}>
            <div className="terminal-box p-4 min-h-48">
              <p className="card-heading text-amber mb-3">{panel.title}</p>
              {panel.content}
            </div>
            <p className="body-text mt-2">{panel.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
