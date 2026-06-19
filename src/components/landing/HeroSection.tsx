import { Link } from 'react-router-dom';
import { TerminalFeed } from './TerminalFeed';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function HeroSection() {
  return (
    <section className="pt-32 pb-24 px-5 sm:px-8 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="hero-eyebrow mb-5 tracking-widest">
          Multi-agent security adjudication
        </p>

        <h1 className="hero-headline mb-5">
          Every alert gets<br />its day in court.
        </h1>

        <p className="hero-subhead max-w-xl mx-auto mb-8">
          Arbiter doesn&apos;t just classify alerts — it argues them.
          Evidence bundles, adversarial debate, and a verdict with full audit trail.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary">
            Try the Demo →
          </Link>
          <button
            type="button"
            onClick={() => scrollTo('how-it-works')}
            className="btn-ghost"
          >
            How It Works
          </button>
        </div>
      </div>

      <TerminalFeed />
    </section>
  );
}
