import { useCallback, useEffect, useRef, useState } from 'react';
import { demoScenarios } from '@/data/demoScenarios';
import { useCaseStore } from '@/store/caseStore';
import type { AgentRole, Evidence, AgentMessage, Claim, Verdict } from '@/types';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function delay(ms: number, signal: { cancelled: boolean; timeouts: number[] }): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();
  return new Promise((resolve) => {
    const id = window.setTimeout(() => {
      if (!signal.cancelled) resolve();
    }, ms);
    signal.timeouts.push(id);
  });
}

// ── Bridge WS event contract (must match bridge/src/types.ts BridgeEvent) ────

interface BridgeEvent {
  type: string;
  payload: Record<string, unknown>;
}

// ── Live-mode helpers ─────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

async function fetchSnapshot(caseId: string): Promise<void> {
  if (!API_URL) return;
  try {
    const res = await fetch(`${API_URL}/case/${encodeURIComponent(caseId)}`);
    if (!res.ok) return;
    const snap = (await res.json()) as {
      caseId: string;
      alertName: string;
      phase: string;
      evidence: Evidence[];
      messages: AgentMessage[];
      claims: Claim[];
      verdict: Verdict | null;
      error: string | null;
    };

    const store = useCaseStore.getState();

    if (snap.alertName) {
      useCaseStore.setState({ alertName: snap.alertName, caseId: snap.caseId });
    }
    snap.evidence.forEach((ev) => store.addEvidence(ev));
    snap.messages.forEach((msg) => store.addMessage(msg));
    snap.claims.forEach((c) => store.addClaim(c));
    if (snap.verdict) store.setVerdict(snap.verdict);
    if (snap.error) store.setCaseError(snap.error);

    const phaseColorMap: Record<string, [string, string]> = {
      open: ['CASE OPENED', '#64748b'],
      triage: ['EVIDENCE COLL.', '#60a5fa'],
      debate: ['AGENT DEBATE', '#a78bfa'],
      judging: ['DELIBERATING', '#f59e0b'],
      awaiting_approval: ['AWAITING APPROVAL', '#f59e0b'],
      closed: ['CASE CLOSED', '#4ade80'],
      error: ['AGENT ERROR', '#f87171'],
    };
    const [label, color] = phaseColorMap[snap.phase] ?? ['LIVE', '#60a5fa'];
    store.setStatus(snap.phase as Parameters<typeof store.setStatus>[0], label, color);
  } catch {
    /* snapshot fetch failed — WS stream is the fallback */
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useAgentStream() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const demoSignalRef = useRef<{ cancelled: boolean; timeouts: number[] }>({
    cancelled: false,
    timeouts: [],
  });

  const store = useCaseStore();

  const clearDemoTimeouts = useCallback(() => {
    demoSignalRef.current.cancelled = true;
    demoSignalRef.current.timeouts.forEach(clearTimeout);
    demoSignalRef.current = { cancelled: false, timeouts: [] };
  }, []);

  const highlightEvidence = useCallback(
    (ids: string[]) => {
      store.setHighlightedEvidence(ids);
      if (ids.length > 0 && !prefersReducedMotion()) {
        const id = window.setTimeout(() => store.setHighlightedEvidence([]), 2500);
        demoSignalRef.current.timeouts.push(id);
      }
    },
    [store],
  );

  // ── Demo playback ──────────────────────────────────────────────────────────

  const runDemo = useCallback(
    async (scenarioIdx: number) => {
      clearDemoTimeouts();
      const signal = demoSignalRef.current;
      const scenario = demoScenarios[scenarioIdx];
      if (!scenario) return;

      store.setStatus('collecting', 'EVIDENCE COLL.', '#f59e0b');
      store.setActiveAgents(['triage']);
      store.setTyping(false);

      if (prefersReducedMotion()) {
        scenario.evidence.forEach((ev) => store.addEvidence(ev));
        store.setStatus('arguing', 'AGENT DEBATE', '#60a5fa');
        scenario.messages.forEach((msg) => store.addMessage(msg));
        scenario.claims.forEach((c) => store.addClaim(c));
        store.setVerdict(scenario.verdict);
        store.setStatus('awaiting_approval', 'AWAITING APPROVAL', '#f59e0b');
        store.setActiveAgents([]);
        return;
      }

      for (const ev of scenario.evidence) {
        if (signal.cancelled) return;
        store.addEvidence(ev);
        await delay(80, signal);
      }

      if (signal.cancelled) return;
      store.setStatus('arguing', 'AGENT DEBATE', '#60a5fa');

      for (const msg of scenario.messages) {
        if (signal.cancelled) return;

        const courtroomAgents: AgentRole[] = [msg.agent].filter(
          (a) => a !== 'orchestrator',
        ) as AgentRole[];
        store.setActiveAgents(courtroomAgents);
        store.setTyping(true);
        await delay(600, signal);
        if (signal.cancelled) return;

        store.setTyping(false);
        store.addMessage(msg);

        if (msg.evidenceCited.length > 0) {
          highlightEvidence(msg.evidenceCited);
        }

        if (msg.agent === 'judge') {
          store.setStatus('deliberating', 'DELIBERATING', '#f59e0b');
        }

        await delay(400, signal);
      }

      if (signal.cancelled) return;
      store.setActiveAgents(['judge']);
      store.setStatus('deliberating', 'DELIBERATING', '#f59e0b');

      for (const claim of scenario.claims) {
        if (signal.cancelled) return;
        store.addClaim(claim);
        await delay(200, signal);
      }

      if (signal.cancelled) return;
      store.setVerdict(scenario.verdict);
      store.setActiveAgents([]);
      store.setStatus('awaiting_approval', 'AWAITING APPROVAL', '#f59e0b');
    },
    [clearDemoTimeouts, highlightEvidence, store],
  );

  const startDemo = useCallback(
    (scenarioIdx: number) => {
      const scenario = demoScenarios[scenarioIdx];
      if (!scenario) return;

      useCaseStore.setState({
        caseId: scenario.caseId,
        alertName: scenario.alertName,
        evidence: [],
        messages: [],
        claims: [],
        verdict: null,
        activeAgents: [],
        highlightedEvidence: [],
        isTyping: false,
        modalOpen: false,
        caseClosed: false,
        caseOutcome: null,
        caseError: null,
        status: 'idle',
        statusLabel: 'INITIALIZING',
        statusColor: '#64748b',
      });

      void runDemo(scenarioIdx);
    },
    [runDemo],
  );

  // ── Live WS message handler ────────────────────────────────────────────────

  const handleBridgeEvent = useCallback(
    (data: BridgeEvent) => {
      switch (data.type) {
        case 'snapshot': {
          // Full state replay on (re)connect — populate store from snapshot
          const snap = data.payload as {
            caseId?: string;
            alertName?: string;
            phase?: string;
            evidence?: Evidence[];
            messages?: AgentMessage[];
            claims?: Claim[];
            verdict?: Verdict | null;
            error?: string | null;
          };
          if (snap.caseId) useCaseStore.setState({ caseId: snap.caseId });
          if (snap.alertName) useCaseStore.setState({ alertName: snap.alertName });
          snap.evidence?.forEach((ev) => store.addEvidence(ev));
          snap.messages?.forEach((msg) => store.addMessage(msg));
          snap.claims?.forEach((c) => store.addClaim(c));
          if (snap.verdict) store.setVerdict(snap.verdict);
          if (snap.error) store.setCaseError(snap.error);
          break;
        }

        case 'evidence': {
          const { items } = data.payload as { items: Evidence[] };
          items?.forEach((ev) => store.addEvidence(ev));
          store.setStatus('triage', 'EVIDENCE COLL.', '#60a5fa');
          store.setActiveAgents(['triage']);
          break;
        }

        case 'message': {
          const msg = data.payload['message'] as AgentMessage | undefined;
          if (!msg) break;
          store.addMessage(msg);
          if (msg.agent && msg.agent !== 'orchestrator') {
            store.setActiveAgents([msg.agent]);
          }
          store.setTyping(false);
          if (msg.evidenceCited?.length) {
            highlightEvidence(msg.evidenceCited);
          }
          if (msg.agent === 'judge') {
            store.setStatus('deliberating', 'DELIBERATING', '#f59e0b');
          }
          break;
        }

        case 'claim': {
          const claim = data.payload['claim'] as Claim | undefined;
          if (claim) store.addClaim(claim);
          break;
        }

        case 'verdict': {
          const verdict = data.payload['verdict'] as Verdict | undefined;
          const alertName = data.payload['alertName'] as string | undefined;
          if (verdict) {
            store.setVerdict(verdict);
            if (alertName) useCaseStore.setState({ alertName });
            store.setStatus('awaiting_approval', 'AWAITING APPROVAL', '#f59e0b');
            store.setActiveAgents([]);
            if (verdict.requiresHumanApproval) store.openModal();
          }
          break;
        }

        case 'status': {
          const { phase, label, color, caseId: cId } = data.payload as {
            phase?: string;
            label?: string;
            color?: string;
            caseId?: string;
          };
          if (label && color) {
            store.setStatus(
              (phase ?? store.status) as Parameters<typeof store.setStatus>[0],
              label,
              color,
            );
          }
          if (cId) useCaseStore.setState({ caseId: cId });
          break;
        }

        case 'typing':
          store.setTyping((data.payload as { active?: boolean }).active ?? false);
          break;

        case 'error': {
          const errMsg = (data.payload as { message?: string }).message ?? 'Unknown bridge error';
          store.setCaseError(errMsg);
          break;
        }
      }
    },
    [highlightEvidence, store],
  );

  // ── Live connect ───────────────────────────────────────────────────────────

  const connect = useCallback(
    (caseId: string) => {
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        const idx = useCaseStore.getState().selectedScenario;
        startDemo(idx);
        return;
      }

      const baseUrl =
        (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:4000/ws/case';
      const url = `${baseUrl}/${encodeURIComponent(caseId)}`;

      // Fetch REST snapshot first so the UI has full state on reconnect
      void fetchSnapshot(caseId);

      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        useCaseStore.setState({
          caseId,
          status: 'debate',
          statusLabel: 'CONNECTING…',
          statusColor: '#60a5fa',
        });
      };
      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => setIsConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as BridgeEvent;
          handleBridgeEvent(data);
        } catch {
          /* ignore malformed messages */
        }
      };
    },
    [handleBridgeEvent, startDemo],
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    clearDemoTimeouts();
  }, [clearDemoTimeouts]);

  useEffect(() => () => disconnect(), [disconnect]);

  return { connect, disconnect, isConnected, startDemo, clearDemoTimeouts };
}

// ── Helper: start a live case via POST /case ──────────────────────────────────

export async function postAlertToLive(
  alertJson: Record<string, unknown>,
): Promise<{ alert_id: string } | { error: string }> {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertJson),
    });
    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) return { error: (body['error'] as string) ?? 'Unknown error' };
    return { alert_id: body['alert_id'] as string };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}
