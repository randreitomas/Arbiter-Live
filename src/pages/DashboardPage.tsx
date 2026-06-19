import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApprovalModal } from '@/components/ApprovalModal';
import { CaseBar } from '@/components/CaseBar';
import { ClosedBanner } from '@/components/ClosedBanner';
import { CourtroomScene } from '@/components/CourtroomScene';
import { DebateFeed } from '@/components/DebateFeed';
import { EvidencePanel } from '@/components/EvidencePanel';
import { JudgePanel } from '@/components/JudgePanel';
import { ScenarioPicker } from '@/components/ScenarioPicker';
import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Tag';
import { useAgentStream, postAlertToLive } from '@/hooks/useAgentStream';
import { useCaseStore } from '@/store/caseStore';

const scenarioLabels = [
  { label: 'Authorized Scanner' },
  { label: 'LSASS Dumping' },
  { label: 'Impossible Travel' },
];

// ── Demo alert payloads (pre-fill for simulation — never sent to Band) ────────

const DEMO_ALERT_JSONS: string[] = [
  JSON.stringify({
    alert_id: 'ALT-DEMO-001',
    source: 'IDS',
    rule_name: 'PORT_SCAN_DETECTED',
    timestamp: '2026-06-19T08:14:00Z',
    asset_id: 'SCANNER-PROD-01',
    asset_criticality: 'low',
    raw_payload: {
      source_ip: '10.0.1.45',
      targets_scanned: 847,
      scan_type: 'TCP_SYN',
      duration_seconds: 720,
    },
  }, null, 2),

  JSON.stringify({
    alert_id: 'ALT-DEMO-002',
    source: 'EDR',
    rule_name: 'LSASS_CREDENTIAL_DUMP',
    timestamp: '2026-06-19T09:01:00Z',
    asset_id: 'FINANCE-SRV-01',
    asset_criticality: 'critical',
    raw_payload: {
      process: 'mimikatz.exe',
      target_process: 'lsass.exe',
      access_rights: '0x1FFFFF',
      user: 'DOMAIN\\svc_backup',
    },
  }, null, 2),

  JSON.stringify({
    alert_id: 'ALT-DEMO-003',
    source: 'SIEM',
    rule_name: 'IMPOSSIBLE_TRAVEL_LOGIN',
    timestamp: '2026-06-19T11:30:00Z',
    asset_id: 'VPN-AUTH-01',
    asset_criticality: 'high',
    raw_payload: {
      user: 'john.doe@company.com',
      location_a: 'New York, US',
      location_b: 'Moscow, RU',
      time_delta_minutes: 8,
    },
  }, null, 2),
];

// ── Live mode: new-case input panel ──────────────────────────────────────────

interface NewCasePanelProps {
  onCaseStarted: (caseId: string) => void;
  onDemoSelected: (idx: number) => void;
}

function NewCasePanel({ onCaseStarted, onDemoSelected }: NewCasePanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoIndex, setDemoIndex] = useState<number>(-1);

  const handleDemoClick = (idx: number) => {
    setDemoIndex(idx);
    setInputText(DEMO_ALERT_JSONS[idx]);
    setError(null);
    textareaRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    // If user edits the text, it's no longer a clean demo prefill
    if (demoIndex >= 0 && value !== DEMO_ALERT_JSONS[demoIndex]) {
      setDemoIndex(-1);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Demo path: run local simulation, never POST to Band
    if (demoIndex >= 0) {
      onDemoSelected(demoIndex);
      setInputText('');
      setDemoIndex(-1);
      return;
    }

    // Live path: validate and POST to Band bridge
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputText) as Record<string, unknown>;
    } catch {
      setError('Invalid JSON — paste a valid Alert object');
      return;
    }
    if (!parsed['alert_id'] || !parsed['rule_name']) {
      setError('Alert must include alert_id and rule_name');
      return;
    }
    setSubmitting(true);
    const result = await postAlertToLive(parsed);
    setSubmitting(false);
    if ('error' in result) {
      setError(result.error);
    } else {
      onCaseStarted(result.alert_id);
      setInputText('');
    }
  };

  const isDemo = demoIndex >= 0;

  return (
    <Panel
      title="Start New Case"
      className="shrink-0"
      contentClassName="p-4"
    >
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── JSON input (left) ── */}
        <div className="flex-1 min-w-0">
          {isDemo && (
            <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded bg-violet/10 border border-violet/25">
              <Tag variant="violet">SIMULATION</Tag>
              <span className="text-[10px] text-muted">
                This is a local demo — no data will be sent to the Band chatroom.
              </span>
            </div>
          )}
          {!isDemo && (
            <p className="text-xs text-muted mb-2 leading-relaxed">
              Paste an Alert JSON with <span className="text-bright">alert_id</span> and{' '}
              <span className="text-bright">rule_name</span>, then submit to the Band room.
            </p>
          )}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={'{\n  "alert_id": "ALT-001",\n  "rule_name": "PORT_SCAN_DETECTED",\n  ...\n}'}
            rows={6}
            className={`w-full bg-surface-2 border rounded-lg text-xs text-body font-mono p-3 mb-3 resize-y transition-colors focus:outline-none ${
              isDemo
                ? 'border-violet/40 focus:border-violet/70'
                : 'border-border focus:border-amber/50'
            } placeholder:text-muted/40`}
            aria-label="Alert JSON input"
          />
          {error && (
            <p className="text-xs text-red mb-3" role="alert">✗ {error}</p>
          )}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !inputText.trim()}
            className={`text-xs font-medium border rounded-lg px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-1 ${
              isDemo
                ? 'text-violet border-violet/40 hover:bg-violet/10 focus-visible:outline-violet'
                : 'text-amber border-amber/40 hover:bg-amber/10 focus-visible:outline-amber'
            }`}
          >
            {submitting ? 'Submitting…' : isDemo ? '▶ Run Simulation →' : 'Submit Alert →'}
          </button>
        </div>

        {/* ── Demo shortcuts (right) ── */}
        <div className="lg:w-52 shrink-0">
          <p className="text-[10px] text-muted uppercase tracking-widest mb-2.5">Try a Demo</p>
          <div className="flex flex-col gap-2">
            {scenarioLabels.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleDemoClick(i)}
                className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-colors ${
                  demoIndex === i
                    ? 'border-violet/60 bg-violet/10 text-violet font-medium'
                    : 'border-border-2 text-muted hover:border-violet/40 hover:text-body'
                }`}
              >
                <span className="text-[10px] opacity-50 mr-1.5">{i + 1}.</span>
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted/60 mt-3 leading-relaxed">
            Simulated end-to-end — fills the JSON above, then press Run.
          </p>
        </div>

      </div>
    </Panel>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const {
    caseId,
    alertName,
    statusLabel,
    statusColor,
    evidence,
    messages,
    claims,
    verdict,
    activeAgents,
    highlightedEvidence,
    isTyping,
    modalOpen,
    caseClosed,
    caseOutcome,
    caseError,
    selectedScenario,
    isDemoMode,
    openModal,
    closeModal,
    approveCase,
    rejectCase,
    setScenario,
    setHighlightedEvidence,
    resetCase,
  } = useCaseStore();

  const { connect, startDemo, clearDemoTimeouts } = useAgentStream();
  const [showNewCase, setShowNewCase] = useState(false);

  const handleStart = useCallback(
    (idx: number) => { clearDemoTimeouts(); startDemo(idx); },
    [clearDemoTimeouts, startDemo],
  );

  useEffect(() => {
    if (isDemoMode) handleStart(selectedScenario);
    return () => clearDemoTimeouts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScenarioSelect = (idx: number) => { setScenario(idx); handleStart(idx); };

  const handleNewCase = () => {
    if (isDemoMode) handleStart(selectedScenario);
    else { resetCase(); setShowNewCase(true); }
  };

  const handleLiveCaseStarted = (newCaseId: string) => {
    setShowNewCase(false);
    connect(newCaseId);
  };

  const handleDemoInLiveMode = (idx: number) => {
    setShowNewCase(false);
    clearDemoTimeouts();
    startDemo(idx);
  };

  const handleEvidenceClick = (id: string) => {
    setHighlightedEvidence([id]);
    setTimeout(() => setHighlightedEvidence([]), 2500);
  };

  const courtroomAgents = activeAgents.filter(
    (a): a is 'triage' | 'prosecutor' | 'defender' | 'judge' =>
      a === 'triage' || a === 'prosecutor' || a === 'defender' || a === 'judge',
  );

  const isRunning = !caseClosed && (messages.length > 0 || isTyping || evidence.length > 0);

  return (
    <div className="font-mono p-3 sm:p-4 min-h-full flex flex-col gap-3 h-full">

      {/* ── Header ── */}
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[10px] text-amber tracking-widest">ARBITER</span>
          <span className="hidden sm:inline text-[11px] text-muted">
            Multi-Agent Security Adjudication
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="text-xs text-muted hover:text-body transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
          >
            Home
          </Link>
          <span className="text-xs font-medium text-amber">Dashboard</span>
          {!isDemoMode && !isRunning && !caseClosed && (
            <button
              type="button"
              onClick={() => setShowNewCase((v) => !v)}
              className="text-xs text-amber hover:text-bright transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
            >
              {showNewCase ? '✕ Cancel' : '+ New Case'}
            </button>
          )}
        </nav>
      </header>

      {/* ── Scenario picker (demo mode) ── */}
      {isDemoMode && (
        <ScenarioPicker
          scenarios={scenarioLabels}
          selected={selectedScenario}
          onSelect={handleScenarioSelect}
          disabled={isRunning && !caseClosed && !verdict}
        />
      )}

      {/* ── New case panel (live mode) ── */}
      {!isDemoMode && showNewCase && (
        <NewCasePanel
          onCaseStarted={handleLiveCaseStarted}
          onDemoSelected={handleDemoInLiveMode}
        />
      )}

      {/* ── Error banner ── */}
      {caseError && (
        <div
          className="panel border-red/40 bg-red/5 px-4 py-3 shrink-0"
          style={{ borderColor: 'rgba(248,81,73,0.4)' }}
          role="alert"
        >
          <p className="text-xs font-semibold text-red mb-1">⚠ Agent error — case halted</p>
          <p className="text-xs text-muted leading-relaxed line-clamp-2">{caseError}</p>
        </div>
      )}

      {/* ── Case status bar ── */}
      <CaseBar caseId={caseId} alertName={alertName} statusLabel={statusLabel} statusColor={statusColor} />

      {/* ── Main 3-column layout ── */}
      {/*
        lg:grid-rows-[1fr] makes the single desktop row fill the flex-1 height,
        giving every panel a constrained height so overflow-y-auto actually scrolls.
        On mobile (grid-cols-1) rows are auto-height and panels stack normally.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] lg:grid-rows-[1fr] gap-3 flex-1 min-h-0">

        {/* Evidence */}
        <div className="min-h-[220px] lg:min-h-0 flex flex-col">
          <EvidencePanel evidence={evidence} highlightedIds={highlightedEvidence} />
        </div>

        {/* Courtroom + Debate */}
        <div className="panel flex flex-col min-h-0">
          <div className="shrink-0 border-b border-border bg-surface-2" style={{ borderRadius: '8px 8px 0 0' }}>
            <CourtroomScene activeAgents={courtroomAgents} />
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <DebateFeed
              messages={messages}
              isTyping={isTyping}
              onEvidenceClick={handleEvidenceClick}
            />
          </div>
        </div>

        {/* Judge */}
        <div className="min-h-[220px] lg:min-h-0 flex flex-col">
          <JudgePanel
            claims={claims}
            verdict={verdict}
            onReviewActions={openModal}
            showReviewButton={!caseClosed}
          />
        </div>
      </div>

      {/* ── Closed banner ── */}
      {caseClosed && caseOutcome && (
        <ClosedBanner
          outcome={caseOutcome}
          timestamp={new Date().toLocaleTimeString('en-US', { hour12: false })}
          onNewCase={handleNewCase}
        />
      )}

      {/* ── Approval modal ── */}
      <ApprovalModal
        open={modalOpen}
        verdict={verdict}
        onApprove={() => approveCase()}
        onReject={() => rejectCase()}
        onClose={closeModal}
      />
    </div>
  );
}
