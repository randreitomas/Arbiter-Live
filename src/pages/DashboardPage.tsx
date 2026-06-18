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
import { useAgentStream, postAlertToLive } from '@/hooks/useAgentStream';
import { useCaseStore } from '@/store/caseStore';

const scenarioLabels = [
  { label: 'AUTHORIZED SCANNER' },
  { label: 'LSASS DUMPING' },
  { label: 'IMPOSSIBLE TRAVEL' },
];

// ── Live mode: new-case input panel ──────────────────────────────────────────

interface NewCasePanelProps {
  onCaseStarted: (caseId: string) => void;
}

function NewCasePanel({ onCaseStarted }: NewCasePanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
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

  return (
    <div className="border border-border bg-surface p-3">
      <p className="text-[8px] text-amber tracking-widest mb-2">START NEW CASE</p>
      <p className="text-[7px] text-muted mb-2 leading-relaxed">
        Paste an Alert JSON (requires <span className="text-bright">alert_id</span> +{' '}
        <span className="text-bright">rule_name</span>) and click Submit to post it to
        the Band room.
      </p>
      <textarea
        ref={textareaRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={'{\n  "alert_id": "ALT-001",\n  "rule_name": "PORT_SCAN_DETECTED",\n  ...\n}'}
        rows={6}
        className="w-full bg-black/40 border border-border text-[7px] text-body font-mono p-2 mb-2 resize-y focus:outline focus:outline-1 focus:outline-amber"
        aria-label="Alert JSON input"
      />
      {error && (
        <p className="text-[7px] text-red mb-2" role="alert">
          ✗ {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting || !inputText.trim()}
        className="text-[7px] text-amber border border-amber/50 px-3 py-1.5 hover:bg-amber/10 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber tracking-wide"
      >
        {submitting ? 'SUBMITTING…' : '→ SUBMIT ALERT'}
      </button>
    </div>
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
    (idx: number) => {
      clearDemoTimeouts();
      startDemo(idx);
    },
    [clearDemoTimeouts, startDemo],
  );

  useEffect(() => {
    if (isDemoMode) {
      handleStart(selectedScenario);
    }
    return () => clearDemoTimeouts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScenarioSelect = (idx: number) => {
    setScenario(idx);
    handleStart(idx);
  };

  const handleNewCase = () => {
    if (isDemoMode) {
      handleStart(selectedScenario);
    } else {
      resetCase();
      setShowNewCase(true);
    }
  };

  const handleLiveCaseStarted = (newCaseId: string) => {
    setShowNewCase(false);
    connect(newCaseId);
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
    <div className="font-pixel p-3 min-h-full flex flex-col gap-2 h-full">
      <header className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber tracking-widest">→ ARBITER</span>
          <span className="text-[7px] text-muted hidden sm:inline tracking-wide">
            MULTI-AGENT SECURITY ADJUDICATION SYSTEM
          </span>
        </div>
        <nav className="flex gap-3">
          <Link
            to="/"
            className="text-[7px] text-muted hover:text-body focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
          >
            HOME
          </Link>
          <span className="text-[7px] text-amber">DASHBOARD</span>
          <Link
            to="/audit"
            className="text-[7px] text-muted hover:text-body focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
          >
            AUDIT LOG
          </Link>
          {!isDemoMode && !isRunning && !caseClosed && (
            <button
              type="button"
              onClick={() => setShowNewCase((v) => !v)}
              className="text-[7px] text-amber hover:text-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber"
            >
              {showNewCase ? '✕ CANCEL' : '+ NEW CASE'}
            </button>
          )}
        </nav>
      </header>

      {isDemoMode && (
        <ScenarioPicker
          scenarios={scenarioLabels}
          selected={selectedScenario}
          onSelect={handleScenarioSelect}
          disabled={isRunning && !caseClosed && !verdict}
        />
      )}

      {/* Live mode: new-case panel */}
      {!isDemoMode && showNewCase && (
        <NewCasePanel onCaseStarted={handleLiveCaseStarted} />
      )}

      {/* Agent error banner */}
      {caseError && (
        <div
          className="border border-red/60 bg-red/10 px-3 py-2"
          role="alert"
          aria-label="Agent error"
        >
          <p className="text-[7px] text-red tracking-wide mb-1">⚠ AGENT ERROR — CASE HALTED</p>
          <p className="text-[6px] text-muted leading-relaxed line-clamp-3">{caseError}</p>
          <p className="text-[6px] text-muted mt-1">
            Check the System Diagnostics Agent posts in the Band room for the full traceback.
          </p>
        </div>
      )}

      <CaseBar
        caseId={caseId}
        alertName={alertName}
        statusLabel={statusLabel}
        statusColor={statusColor}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-2 flex-1 min-h-0">
        <div className="border border-border bg-surface p-3 min-h-[200px] lg:min-h-0 flex flex-col">
          <EvidencePanel evidence={evidence} highlightedIds={highlightedEvidence} />
        </div>

        <div className="border border-border bg-surface p-3 flex flex-col gap-3 min-h-0">
          <CourtroomScene activeAgents={courtroomAgents} />
          <DebateFeed
            messages={messages}
            isTyping={isTyping}
            onEvidenceClick={handleEvidenceClick}
          />
        </div>

        <div className="border border-border bg-surface p-3 min-h-[200px] lg:min-h-0 flex flex-col">
          <JudgePanel
            claims={claims}
            verdict={verdict}
            onReviewActions={openModal}
            showReviewButton={!caseClosed}
          />
        </div>
      </div>

      {caseClosed && caseOutcome && (
        <ClosedBanner
          outcome={caseOutcome}
          timestamp={new Date().toLocaleTimeString('en-US', { hour12: false })}
          onNewCase={handleNewCase}
        />
      )}

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
