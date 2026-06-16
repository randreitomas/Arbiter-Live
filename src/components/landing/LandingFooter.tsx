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
    <footer id="demo" className="border-t border-border py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 label-text">
            <span className="wordmark text-[8px]">ARBITER</span>
            <span>·</span>
            <span>Band of Agents Hackathon 2025</span>
            <span>·</span>
            <span>Built with Band, LangChain, CrewAI</span>
          </div>
          <Link
            to="/dashboard"
            className="label-text text-amber border border-amber px-4 py-2 hover:bg-amber/10 transition-colors shrink-0"
          >
            [ → Try the Demo ]
          </Link>
        </div>

        <div className="text-center border-t border-border pt-6">
          <p className="label-text uppercase tracking-widest mb-3">Developed by</p>
          <p className="body-text">
            {DEVELOPERS.join(' · ')}
          </p>
        </div>
      </div>
    </footer>
  );
}
