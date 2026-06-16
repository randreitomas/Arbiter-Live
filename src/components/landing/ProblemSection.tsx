import { SectionEyebrow } from './SectionEyebrow';

const stats = [
  { value: '1,000+', label: 'alerts per analyst per day' },
  { value: '~45%', label: 'of all SIEM alerts' },
  { value: '4.2 hrs', label: 'average per incident (IBM)' },
];

const statLabels = ['Alert volume', 'False positive rate', 'Triage time'];

export function ProblemSection() {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <SectionEyebrow>[ THE PROBLEM ]</SectionEyebrow>
        <h2 className="section-heading">The alert queue never sleeps.</h2>
        <p className="section-subhead">
          Security teams are buried in noise. Every minute spent on a false positive is a minute not spent on a real breach.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((stat, i) => (
          <div
            key={statLabels[i]}
            className="bg-surface border border-border p-6 text-center"
          >
            <p className="label-text uppercase mb-3">{statLabels[i]}</p>
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="body-text text-center max-w-2xl mx-auto">
        Analysts are drowning. Arbiter gives every alert a structured hearing — and a decision you can audit.
      </p>
    </section>
  );
}
