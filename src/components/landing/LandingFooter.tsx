import { Link } from 'react-router-dom';

const DEVELOPERS = [
  'Paul Dacalan',
  'Xander Dacillo',
  'Kisha Gaytano',
  'David Grün',
  'Lanz Mañalac',
  'Ralph Masangkay',
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-12 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <p className="font-pixel text-[10px] text-amber tracking-widest mb-1">ARBITER</p>
            <p className="text-[12px] text-muted">
              Band of Agents Hackathon · Built with Band, LangChain, CrewAI
            </p>
          </div>
          <Link to="/dashboard" className="btn-ghost shrink-0">
            Try the Demo →
          </Link>
        </div>

        <div className="border-t border-border pt-6 text-center">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-2">Developed by</p>
          <p className="text-[12px] text-muted/70">
            {DEVELOPERS.join(' · ')}
          </p>
        </div>
      </div>
    </footer>
  );
}
