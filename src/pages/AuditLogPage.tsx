import { Link } from 'react-router-dom';

const auditRows = [
  {
    caseId: 'A-002',
    alertType: 'LSASS CREDENTIAL DUMPING',
    verdict: 'REAL INCIDENT',
    severity: 'HIGH',
    confidence: '87%',
    timestamp: '2026-06-15 09:02:01',
    analyst: 'j.chen',
  },
  {
    caseId: 'A-001',
    alertType: 'AUTHORIZED PORT SCAN',
    verdict: 'FALSE POSITIVE',
    severity: 'LOW',
    confidence: '94%',
    timestamp: '2026-06-15 08:14:58',
    analyst: 'auto-pipeline',
  },
  {
    caseId: 'A-003',
    alertType: 'IMPOSSIBLE TRAVEL',
    verdict: 'INVESTIGATE',
    severity: 'MEDIUM',
    confidence: '61%',
    timestamp: '2026-06-14 11:22:55',
    analyst: 'm.patel',
  },
  {
    caseId: 'A-004',
    alertType: 'POWERSHELL ENCODED CMD',
    verdict: 'REAL INCIDENT',
    severity: 'CRITICAL',
    confidence: '92%',
    timestamp: '2026-06-14 03:17:44',
    analyst: 's.okonkwo',
  },
  {
    caseId: 'A-005',
    alertType: 'DNS TUNNELING',
    verdict: 'FALSE POSITIVE',
    severity: 'LOW',
    confidence: '88%',
    timestamp: '2026-06-13 16:45:12',
    analyst: 'auto-pipeline',
  },
  {
    caseId: 'A-006',
    alertType: 'BRUTE FORCE RDP',
    verdict: 'INVESTIGATE',
    severity: 'MEDIUM',
    confidence: '55%',
    timestamp: '2026-06-12 22:08:33',
    analyst: 'k.nguyen',
  },
];

function verdictClass(verdict: string) {
  if (verdict === 'REAL INCIDENT') return 'text-red';
  if (verdict === 'FALSE POSITIVE') return 'text-green';
  return 'text-amber';
}

export function AuditLogPage() {
  return (
    <div className="font-pixel p-3 min-h-full flex flex-col gap-4 h-full">
      <header className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber tracking-widest">→ ARBITER</span>
          <span className="text-[7px] text-muted tracking-wide">AUDIT LOG</span>
        </div>
        <nav>
          <Link
            to="/dashboard"
            className="text-[7px] text-muted hover:text-body focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
          >
            ← DASHBOARD
          </Link>
        </nav>
      </header>

      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full text-left" aria-label="Audit log of adjudicated cases">
          <thead>
            <tr className="border-b border-border">
              {['CASE ID', 'ALERT TYPE', 'VERDICT', 'SEVERITY', 'CONFIDENCE', 'TIMESTAMP', 'ANALYST'].map(
                (h) => (
                  <th key={h} className="text-[7px] text-amber p-2 tracking-wide font-normal">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {auditRows.map((row) => (
              <tr key={row.caseId} className="border-b border-border/50 hover:bg-white/[0.02]">
                <td className="text-[7px] text-bright p-2">{row.caseId}</td>
                <td className="text-[7px] text-body p-2">{row.alertType}</td>
                <td className={`text-[7px] p-2 ${verdictClass(row.verdict)}`}>{row.verdict}</td>
                <td className="text-[7px] text-body p-2">{row.severity}</td>
                <td className="text-[7px] text-muted p-2">{row.confidence}</td>
                <td className="text-[7px] text-muted p-2">{row.timestamp}</td>
                <td className="text-[7px] text-muted p-2">{row.analyst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
