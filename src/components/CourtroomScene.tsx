import type { AgentRole } from '@/types';

interface CourtroomSceneProps {
  activeAgents: AgentRole[];
}

const INACTIVE = '#2a2f3d';
const COLORS = {
  judge: '#f59e0b',
  prosecutor: '#f87171',
  defender: '#4ade80',
  triage: '#60a5fa',
} as const;

function isActive(activeAgents: AgentRole[], role: keyof typeof COLORS) {
  return activeAgents.includes(role);
}

function agentColor(activeAgents: AgentRole[], role: keyof typeof COLORS) {
  return isActive(activeAgents, role) ? COLORS[role] : INACTIVE;
}

function glowFilter(activeAgents: AgentRole[], role: keyof typeof COLORS, id: string) {
  if (!isActive(activeAgents, role)) return null;
  return (
    <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={COLORS[role]} floodOpacity="0.9" />
    </filter>
  );
}

function PixelPerson({
  x,
  y,
  color,
  filterId,
  hairColor = '#e2e8f0',
  glasses = false,
}: {
  x: number;
  y: number;
  color: string;
  filterId?: string;
  hairColor?: string;
  glasses?: boolean;
}) {
  return (
    <g transform={`translate(${x},${y})`} filter={filterId ? `url(#${filterId})` : undefined}>
      {/* Head */}
      <rect x="4" y="0" width="12" height="10" fill={color} />
      {/* Hair */}
      <rect x="3" y="-2" width="14" height="4" fill={hairColor} />
      {/* Body */}
      <rect x="2" y="10" width="16" height="14" fill={color} />
      {/* Arms */}
      <rect x="-2" y="12" width="6" height="4" fill={color} />
      <rect x="18" y="12" width="6" height="4" fill={color} />
      {/* Legs */}
      <rect x="4" y="24" width="5" height="8" fill={color} />
      <rect x="11" y="24" width="5" height="8" fill={color} />
      {glasses && (
        <>
          <rect x="5" y="3" width="4" height="3" fill="none" stroke="#0a0c10" strokeWidth="0.8" />
          <rect x="11" y="3" width="4" height="3" fill="none" stroke="#0a0c10" strokeWidth="0.8" />
          <line x1="9" y1="4.5" x2="11" y2="4.5" stroke="#0a0c10" strokeWidth="0.8" />
        </>
      )}
    </g>
  );
}

export function CourtroomScene({ activeAgents }: CourtroomSceneProps) {
  const roles: (keyof typeof COLORS)[] = ['judge', 'prosecutor', 'defender', 'triage'];

  return (
    <svg
      viewBox="0 0 340 160"
      className="w-full h-auto"
      aria-label="Courtroom scene showing active security agents"
      role="img"
    >
      <defs>
        {roles.map((role) => glowFilter(activeAgents, role, role))}
        {/* Wood panel background */}
        <pattern id="wood" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#1a1d26" />
          <line x1="0" y1="4" x2="8" y2="4" stroke="#22262f" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Room background */}
      <rect x="0" y="0" width="340" height="160" fill="#0a0c10" />
      <rect x="10" y="10" width="320" height="100" fill="url(#wood)" rx="2" />

      {/* Judge bench */}
      <rect x="120" y="18" width="100" height="8" fill="#2a2f3d" />
      <rect x="115" y="26" width="110" height="22" fill="#1e222d" stroke="#2a2f3d" strokeWidth="1" />
      {isActive(activeAgents, 'judge') && (
        <rect x="115" y="26" width="110" height="22" fill={COLORS.judge} opacity="0.05" />
      )}
      <text x="170" y="16" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="'Press Start 2P', monospace">
        JUDGE
      </text>
      <PixelPerson
        x={155}
        y={28}
        color={agentColor(activeAgents, 'judge')}
        filterId={isActive(activeAgents, 'judge') ? 'glow-judge' : undefined}
        glasses
      />

      {/* Defender desk (left) */}
      <rect x="25" y="55" width="70" height="6" fill="#2a2f3d" />
      <rect x="20" y="61" width="80" height="18" fill="#1e222d" stroke="#2a2f3d" strokeWidth="1" />
      {isActive(activeAgents, 'defender') && (
        <rect x="20" y="61" width="80" height="18" fill={COLORS.defender} opacity="0.05" />
      )}
      <text x="60" y="53" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="'Press Start 2P', monospace">
        DEFENDER
      </text>
      <PixelPerson
        x={42}
        y={62}
        color={agentColor(activeAgents, 'defender')}
        filterId={isActive(activeAgents, 'defender') ? 'glow-defender' : undefined}
      />

      {/* Prosecutor desk (right) */}
      <rect x="245" y="55" width="70" height="6" fill="#2a2f3d" />
      <rect x="240" y="61" width="80" height="18" fill="#1e222d" stroke="#2a2f3d" strokeWidth="1" />
      {isActive(activeAgents, 'prosecutor') && (
        <rect x="240" y="61" width="80" height="18" fill={COLORS.prosecutor} opacity="0.05" />
      )}
      <text x="280" y="53" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="'Press Start 2P', monospace">
        PROSECUTOR
      </text>
      <PixelPerson
        x={262}
        y={62}
        color={agentColor(activeAgents, 'prosecutor')}
        filterId={isActive(activeAgents, 'prosecutor') ? 'glow-prosecutor' : undefined}
      />

      {/* Triage stand (center-front) */}
      <rect x="148" y="78" width="44" height="4" fill="#2a2f3d" />
      <rect x="150" y="82" width="40" height="16" fill="#1e222d" stroke="#2a2f3d" strokeWidth="1" />
      {isActive(activeAgents, 'triage') && (
        <rect x="150" y="82" width="40" height="16" fill={COLORS.triage} opacity="0.05" />
      )}
      <text x="170" y="76" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="'Press Start 2P', monospace">
        TRIAGE
      </text>
      <PixelPerson
        x={158}
        y={82}
        color={agentColor(activeAgents, 'triage')}
        filterId={isActive(activeAgents, 'triage') ? 'glow-triage' : undefined}
      />

      {/* Gallery silhouettes */}
      <g fill="#1a1d26">
        {Array.from({ length: 14 }).map((_, i) => (
          <g key={i} transform={`translate(${18 + i * 22}, 118)`}>
            <ellipse cx="6" cy="4" rx="5" ry="4" />
            <rect x="2" y="8" width="8" height="10" rx="1" />
          </g>
        ))}
      </g>

      {/* Floor line */}
      <line x1="10" y1="130" x2="330" y2="130" stroke="#2a2f3d" strokeWidth="1" />

      {/* Decorative pillars */}
      <rect x="10" y="10" width="4" height="120" fill="#151820" />
      <rect x="326" y="10" width="4" height="120" fill="#151820" />
    </svg>
  );
}
