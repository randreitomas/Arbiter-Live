import { SectionEyebrow } from './SectionEyebrow';

const checklist = [
  'Every verdict is citation-backed',
  'Every claim references a specific evidence ID',
  'Human approval required before any action executes',
  'Full audit trail — fit for SOC 2 or breach review',
  'Escalation path when agent confidence is low',
];

export function Track3Section() {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border">
      <div className="track3-panel border border-amber p-8 sm:p-10 text-center max-w-3xl mx-auto">
        <SectionEyebrow className="!text-amber">
          [ TRACK 3: REGULATED & HIGH-STAKES WORKFLOWS ]
        </SectionEyebrow>

        <p className="font-mono text-lg text-landing-bright font-bold mb-8 leading-relaxed">
          Built for environments where a wrong call has real consequences.
        </p>

        <ul className="text-left max-w-md mx-auto space-y-3">
          {checklist.map((item) => (
            <li key={item} className="font-mono text-sm text-landing-body flex gap-2">
              <span className="text-green shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
