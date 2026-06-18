/**
 * In-memory case state store.
 * Keyed by alert_id. One CaseState per active case.
 */

import type { CaseState, CasePhase, Evidence, AgentMessage, Claim, Verdict } from './types.js';

const cases = new Map<string, CaseState>();

export function getCase(caseId: string): CaseState | undefined {
  return cases.get(caseId);
}

export function getAllCases(): CaseState[] {
  return [...cases.values()];
}

export function openCase(alertId: string, alertName: string): CaseState {
  const existing = cases.get(alertId);
  if (existing) return existing;

  const state: CaseState = {
    caseId: alertId,
    alertName,
    phase: 'open',
    alert: null,
    bundle: null,
    evidence: [],
    messages: [],
    claims: [],
    verdict: null,
    error: null,
    prosecutionPosted: false,
    defensePosted: false,
    openedAt: Date.now(),
    updatedAt: Date.now(),
  };
  cases.set(alertId, state);
  return state;
}

export function updatePhase(caseId: string, phase: CasePhase): CaseState | null {
  const state = cases.get(caseId);
  if (!state) return null;
  state.phase = phase;
  state.updatedAt = Date.now();
  return state;
}

export function addEvidence(caseId: string, items: Evidence[]): CaseState | null {
  const state = cases.get(caseId);
  if (!state) return null;
  // Merge: avoid duplicates by evidence_id
  for (const item of items) {
    if (!state.evidence.find((e) => e.evidence_id === item.evidence_id)) {
      state.evidence.push(item);
    }
  }
  state.updatedAt = Date.now();
  return state;
}

export function addMessage(caseId: string, msg: AgentMessage): CaseState | null {
  const state = cases.get(caseId);
  if (!state) return null;
  state.messages.push(msg);

  if (msg.agent === 'prosecutor') state.prosecutionPosted = true;
  if (msg.agent === 'defender') state.defensePosted = true;

  // Update citedBy on evidence items
  for (const evId of msg.evidenceCited) {
    const ev = state.evidence.find((e) => e.evidence_id === evId);
    if (ev && !ev.citedBy.includes(msg.agent)) {
      ev.citedBy.push(msg.agent);
    }
  }

  state.updatedAt = Date.now();
  return state;
}

export function addClaim(caseId: string, claim: Claim): CaseState | null {
  const state = cases.get(caseId);
  if (!state) return null;
  state.claims.push(claim);
  state.updatedAt = Date.now();
  return state;
}

export function setVerdict(caseId: string, verdict: Verdict): CaseState | null {
  const state = cases.get(caseId);
  if (!state) return null;
  state.verdict = verdict;
  state.phase = verdict.requiresHumanApproval ? 'awaiting_approval' : 'closed';
  state.updatedAt = Date.now();
  return state;
}

export function setError(caseId: string, message: string): CaseState | null {
  const state = cases.get(caseId);
  if (!state) return null;
  state.error = message;
  state.phase = 'error';
  state.updatedAt = Date.now();
  return state;
}

/**
 * Attempt to find the most recently updated open case.
 * Used when an incoming message lacks a clear alert_id association.
 */
export function findActiveCase(): CaseState | undefined {
  let latest: CaseState | undefined;
  for (const state of cases.values()) {
    if (state.phase === 'error' || state.phase === 'closed') continue;
    if (!latest || state.updatedAt > latest.updatedAt) latest = state;
  }
  return latest;
}

export function buildSnapshot(state: CaseState): import('./types.js').SnapshotPayload {
  return {
    caseId: state.caseId,
    alertName: state.alertName,
    phase: state.phase,
    evidence: state.evidence,
    messages: state.messages,
    claims: state.claims,
    verdict: state.verdict,
    error: state.error,
  };
}
