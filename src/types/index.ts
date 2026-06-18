/**
 * Frontend types — aligned with the real backend contract.
 * Every field here is traceable to one of:
 *   (a) a real structured field from Triage's EvidenceBundle
 *   (b) a regex-extracted token verifiably present in real agent output
 *   (c) full untouched prose for qualitative content (Judge reasoning)
 * See INTEGRATION_NOTES.md for approximations.
 */

export type AgentRole = 'triage' | 'prosecutor' | 'defender' | 'judge' | 'orchestrator';

export type CaseStatus =
  | 'idle'
  | 'collecting'   // demo alias for 'triage'
  | 'triage'
  | 'arguing'      // demo alias for 'debate'
  | 'debate'
  | 'deliberating' // demo alias for 'judging'
  | 'judging'
  | 'awaiting_approval'
  | 'closed'
  | 'error';

// ── Evidence (fields from triage/schemas.py) ─────────────────────────────────

export type EvidenceSourceType =
  | 'raw_log'
  | 'cmdb'
  | 'baseline'
  | 'geo'
  | 'lineage'
  | 'mitre';

export interface Evidence {
  /** Stable citation anchor matching EVD-[0-9a-f]{6}-\d{3}. From Triage JSON. */
  evidence_id: string;
  /** Human-readable fact statement. From Triage JSON field `fact`. */
  fact: string;
  source_type: EvidenceSourceType;
  /** 0–1 float from Triage JSON. Authoritative. */
  confidence: number;
  raw_ref: string | null;
  /**
   * Derived: populated by the bridge/stream when Prosecutor or Defender
   * cites this ID. Not present in backend output directly.
   */
  citedBy: AgentRole[];
}

// ── Agent messages ────────────────────────────────────────────────────────────

export type AgentMessageType =
  | 'argument'
  | 'concede'
  | 'verdict'
  | 'status'
  | 'error';
  // Note: 'rebuttal' removed — no reliable signal for it exists in real agent output.

export interface AgentMessage {
  id: string;
  agent: AgentRole;
  type: AgentMessageType;
  text: string;
  /** Parsed from Prosecutor/Defender "Position:" opening line. */
  position?: string;
  /** EVD-* IDs regex-extracted from prose. */
  evidenceCited: string[];
  /** MITRE T#### IDs regex-extracted from prose. */
  mitre: string[];
  timestamp: string;
}

// ── Claims ────────────────────────────────────────────────────────────────────

export interface Claim {
  id: string;
  /** Which agent made this claim. */
  agent: 'prosecutor' | 'defender';
  /**
   * 'concede' — agent's own Position line says CONCEDE (certain).
   * 'struck'  — Judge prose explicitly named this claim as struck (best-effort).
   * 'valid'   — surviving; default for all un-conceded claims.
   */
  status: 'valid' | 'concede' | 'struck';
  text: string;
  evidenceIds: string[];
}

// ── Verdict ───────────────────────────────────────────────────────────────────

/** Matches judge/agent.py JUDGE_DICTIONARY keys exactly. */
export type VerdictDecision =
  | 'real_incident'
  | 'false_positive'
  | 'escalate_human'
  | 'needs_more_evidence';

export type VerdictSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Qualitative confidence band — approximation from Judge prose.
 * 'unknown' when no confidence language was found.
 * See INTEGRATION_NOTES.md.
 */
export type VerdictConfidence = 'low' | 'medium' | 'high' | 'very_high' | 'unknown';

export interface Verdict {
  decision: VerdictDecision;
  /** Parsed from Judge prose. May be null if severity language was absent. */
  severity: VerdictSeverity | null;
  /** Qualitative confidence band — never a fabricated percentage. */
  confidence: VerdictConfidence;
  /**
   * Full prose from the Judge verbatim — NOT bullet-split.
   * Displayed as-is so reviewers read exactly what the Judge wrote.
   */
  reasoning: string;
  /** EVD-* IDs mentioned in the ruling. */
  evidenceCited: string[];
  requiresHumanApproval: boolean;
  /**
   * Best-effort free-text extraction of implied actions from Judge prose.
   * May be null. See INTEGRATION_NOTES.md.
   * Labeled "implied actions" in the UI to distinguish from a guaranteed list.
   */
  impliedActions: string | null;
}

// ── Demo scenario (keeps demo mode fully functional) ─────────────────────────

export interface DemoScenario {
  caseId: string;
  alertName: string;
  evidence: Evidence[];
  messages: AgentMessage[];
  claims: Claim[];
  verdict: Verdict;
}

// ── UI constants ──────────────────────────────────────────────────────────────

export const AGENT_COLORS: Record<AgentRole, string> = {
  orchestrator: '#e2e8f0',
  triage: '#60a5fa',
  prosecutor: '#f87171',
  defender: '#4ade80',
  judge: '#f59e0b',
};

export const AGENT_LABELS: Record<AgentRole, string> = {
  orchestrator: 'ORCHESTRATOR',
  triage: 'TRIAGE',
  prosecutor: 'PROSECUTOR',
  defender: 'DEFENDER',
  judge: 'JUDGE',
};

export const VERDICT_LABELS: Record<VerdictDecision, string> = {
  real_incident: 'REAL INCIDENT',
  false_positive: 'FALSE POSITIVE',
  escalate_human: 'ESCALATE TO HUMAN',
  needs_more_evidence: 'NEEDS MORE EVIDENCE',
};

export const VERDICT_COLORS: Record<VerdictDecision, string> = {
  real_incident: '#f87171',
  false_positive: '#4ade80',
  escalate_human: '#f59e0b',
  needs_more_evidence: '#60a5fa',
};
