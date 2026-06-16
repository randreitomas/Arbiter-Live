import { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApprovalModal } from '@/components/ApprovalModal';
import { CaseBar } from '@/components/CaseBar';
import { ClosedBanner } from '@/components/ClosedBanner';
import { CourtroomScene } from '@/components/CourtroomScene';
import { DebateFeed } from '@/components/DebateFeed';
import { EvidencePanel } from '@/components/EvidencePanel';
import { JudgePanel } from '@/components/JudgePanel';
import { ScenarioPicker } from '@/components/ScenarioPicker';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useCaseStore } from '@/store/caseStore';

const scenarioLabels = [
  { label: 'AUTHORIZED SCANNER' },
  { label: 'LSASS DUMPING' },
  { label: 'IMPOSSIBLE TRAVEL' },
];

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
    selectedScenario,
    isDemoMode,
    openModal,
    closeModal,
    approveCase,
    rejectCase,
    setScenario,
    setHighlightedEvidence,
  } = useCaseStore();

  const { startDemo, clearDemoTimeouts } = useAgentStream();

  const handleStart = useCallback(
    (idx: number) => {
      clearDemoTimeouts();
      startDemo(idx);
    },
    [clearDemoTimeouts, startDemo],
  );

  useEffect(() => {
    handleStart(selectedScenario);
    return () => clearDemoTimeouts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScenarioSelect = (idx: number) => {
    setScenario(idx);
    handleStart(idx);
  };

  const handleNewCase = () => {
    handleStart(selectedScenario);
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
        actions={verdict?.recommendedActions ?? []}
        onApprove={() => approveCase()}
        onReject={() => rejectCase()}
        onClose={closeModal}
      />
    </div>
  );
}
