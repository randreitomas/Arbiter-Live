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

interface WsMessage {
  type: string;
  payload: Record<string, unknown>;
}

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
        status: 'idle',
        statusLabel: 'INITIALIZING',
        statusColor: '#64748b',
      });

      void runDemo(scenarioIdx);
    },
    [runDemo],
  );

  const handleWsMessage = useCallback(
    (data: WsMessage) => {
      switch (data.type) {
        case 'evidence':
          store.addEvidence(data.payload as unknown as Evidence);
          break;
        case 'message': {
          const msg = data.payload as unknown as AgentMessage;
          store.addMessage(msg);
          if (msg.agent) {
            store.setActiveAgents([msg.agent]);
          }
          store.setTyping(false);
          if (msg.evidenceCited?.length) {
            highlightEvidence(msg.evidenceCited);
          }
          break;
        }
        case 'claim':
          store.addClaim(data.payload as unknown as Claim);
          break;
        case 'verdict':
          store.setVerdict(data.payload as unknown as Verdict);
          store.setStatus('awaiting_approval', 'AWAITING APPROVAL', '#f59e0b');
          store.setActiveAgents([]);
          break;
        case 'status': {
          const { label, color, status } = data.payload as {
            label: string;
            color: string;
            status?: string;
          };
          store.setStatus(
            (status as typeof store.status) ?? store.status,
            label,
            color,
          );
          break;
        }
        case 'typing':
          store.setTyping((data.payload as { active: boolean }).active);
          break;
      }
    },
    [highlightEvidence, store],
  );

  const connect = useCallback(
    (caseId: string) => {
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        const idx = useCaseStore.getState().selectedScenario;
        startDemo(idx);
        return;
      }

      const baseUrl = import.meta.env.VITE_WS_URL ?? 'wss://localhost:8000/ws/case';
      const url = `${baseUrl}/${caseId}`;

      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => setIsConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as WsMessage;
          handleWsMessage(data);
        } catch {
          /* ignore malformed messages */
        }
      };
    },
    [handleWsMessage, startDemo],
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
