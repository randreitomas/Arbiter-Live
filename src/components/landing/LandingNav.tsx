import { Link } from 'react-router-dom';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingNav() {
  return (
    <nav className="landing-nav fixed top-0 left-0 right-0 z-40 bg-bg border-b border-border">
      <div className="amber-strip h-0.5 w-full bg-amber" aria-hidden="true" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-pixel text-[10px] text-amber tracking-widest hover:opacity-80">
          ARBITER
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => scrollTo('how-it-works')}
            className="hidden sm:inline font-mono text-[11px] text-landing-muted uppercase tracking-widest hover:text-landing-bright transition-colors"
          >
            [ HOW IT WORKS ]
          </button>
          <button
            type="button"
            onClick={() => scrollTo('agents')}
            className="hidden sm:inline font-mono text-[11px] text-landing-muted uppercase tracking-widest hover:text-landing-bright transition-colors"
          >
            [ AGENTS ]
          </button>
          <Link
            to="/dashboard"
            className="font-mono text-[11px] text-amber border border-amber px-3 py-1.5 uppercase tracking-widest hover:bg-amber/10 transition-colors"
          >
            [ DEMO ]
          </Link>
        </div>
      </div>
    </nav>
  );
}
