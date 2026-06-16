import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer id="demo" className="border-t border-border py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-landing-muted">
          <span className="font-pixel text-[8px] text-amber">ARBITER</span>
          <span>·</span>
          <span>Band of Agents Hackathon 2025</span>
          <span>·</span>
          <span>Built with Band, LangChain, CrewAI</span>
        </div>
        <Link
          to="/dashboard"
          className="font-mono text-[11px] text-amber border border-amber px-4 py-2 hover:bg-amber/10 transition-colors"
        >
          [ → Try the Demo ]
        </Link>
      </div>
    </footer>
  );
}
