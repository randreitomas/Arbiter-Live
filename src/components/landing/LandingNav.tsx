import { Link } from 'react-router-dom';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingNav() {
  return (
    <nav className="landing-nav fixed top-0 left-0 right-0 z-40 border-b border-border">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="font-pixel text-[10px] text-amber tracking-widest hover:opacity-75 transition-opacity">
          ARBITER
        </Link>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => scrollTo('how-it-works')}
            className="hidden sm:inline text-[12px] text-muted hover:text-bright transition-colors"
          >
            How It Works
          </button>
          <Link
            to="/dashboard"
            className="btn-ghost text-[12px] !py-1.5 !px-4"
          >
            Try Demo →
          </Link>
        </div>
      </div>
    </nav>
  );
}
