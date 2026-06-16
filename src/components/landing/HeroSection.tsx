import { Link } from 'react-router-dom';
import { TerminalFeed } from './TerminalFeed';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function HeroSection() {
  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="section-eyebrow">[ MULTI-AGENT SECURITY ADJUDICATION ]</p>

        <h1 className="hero-headline">
          Every alert gets
          <br />
          its day in court.
        </h1>

        <p className="hero-subhead">
          Arbiter doesn&apos;t just classify alerts.
          <br />
          It argues them — with evidence, citations, and a verdict fit for a SOC 2 audit.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/dashboard"
            className="cta-primary bg-amber text-bg px-5 py-2.5 hover:bg-amber/90 transition-colors"
          >
            → Try the Demo
          </Link>
          <button
            type="button"
            onClick={() => scrollTo('how-it-works')}
            className="cta-secondary text-amber border border-amber px-5 py-2.5 hover:bg-amber/10 transition-colors"
          >
            ↓ How It Works
          </button>
        </div>
      </div>

      <TerminalFeed />
    </section>
  );
}
