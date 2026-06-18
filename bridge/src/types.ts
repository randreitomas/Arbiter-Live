/**
 * Types shared across the bridge service.
 * These also define the WebSocket event contract served to Arbiter-Live.
 */

// ── Evidence (matches triage/schemas.py EvidenceBundle) ─────────────────────

export type EvidenceSourceType =
  | 'raw_log'
  | 'cmdb'
  | 'baseline'
  | 'geo'
  | 'lineage'
  | 'mitre';

export interface Evidence {
  evidence_id: string;        // EVD-[0-9a-f]{6}-\d{3}
  fact: string;
  source_type: EvidenceSourceType;
  confidence: number;         // 0–1 float
  raw_ref: string | null;
  citedBy: string[];          // derived: AgentRole values that cited this ID
}

export interface EvidenceBundle {
  bundle_id: string;
  alert_id: string;
  schema_version: '1.0';
  generated_at: string;
  alert_type: string;
  asset_criticality: string;
  evidence: Evidence[];
  mitre_candidates: string[];
  open_questions: string[];
}

// ── Alert (matches shared/models.py Alert and demo/*.json) ───────────────────

export interface Alert {
  alert_id: string;
  source: string;
  rule_name: string;
  timestamp: string;
  asset_id: string;
  asset_criticality: string;
  raw_payload: Record<string, unknown>;
}

// ── Agent messages (Prosecutor / Defender prose) ─────────────────────────────

export type AgentRole =
  | 'triage'
  | 'prosecutor'
  | 'defender'
  | 'judge'
  | 'orchestrator';

export type AgentMessageType = 'argument' | 'concede' | 'verdict' | 'status' | 'error';

export interface AgentMessage {
  id: string;
  agent: AgentRole;
  type: AgentMessageType;
  text: string;               // full prose
  position?: string;          // e.g. "REAL INCIDENT", "BENIGN", "CONCEDE"
  evidenceCited: string[];    // EVD-* IDs extracted from text
  mitre: string[];            // T1234 or T1234.001 IDs extracted from text
  timestamp: string;          // ISO-8601
}

// ── Claims (derived from prosecution/defense messages) ───────────────────────

export interface Claim {
  id: string;
  agent: 'prosecutor' | 'defender';
  status: 'valid' | 'concede' | 'struck';
  text: string;               // first sentence / position statement
  evidenceIds: string[];
}

// ── Verdict (parsed from Judge prose) ────────────────────────────────────────

export type VerdictDecision =
  | 'real_incident'
  | 'false_positive'
  | 'escalate_human'
  | 'needs_more_evidence';

export type VerdictSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Qualitative confidence band mapped from Judge's prose.
 * Approximation: see INTEGRATION_NOTES.md.
 */
export type VerdictConfidence = 'low' | 'medium' | 'high' | 'very_high' | 'unknown';

export interface Verdict {
  decision: VerdictDecision;
  severity: VerdictSeverity | null;
  confidence: VerdictConfidence;
  /**
   * Full prose from the Judge — NOT bullet-split.
   * Displayed verbatim so the human reviewer reads exactly what the Judge wrote.
   */
  reasoning: string;
  evidenceCited: string[];    // EVD-* IDs mentioned in the ruling
  requiresHumanApproval: boolean;
  /**
   * Best-effort free-text extraction of implied actions from the Judge's prose.
   * Approximation — see INTEGRATION_NOTES.md. May be null if no action language found.
   */
  impliedActions: string | null;
}

// ── Case state held in-memory by the bridge ──────────────────────────────────

export type CasePhase =
  | 'open'
  | 'triage'
  | 'debate'
  | 'judging'
  | 'awaiting_approval'
  | 'closed'
  | 'error';

export interface CaseState {
  caseId: string;               // alert_id
  alertName: string;            // alert rule_name
  phase: CasePhase;
  alert: Alert | null;
  bundle: EvidenceBundle | null;
  evidence: Evidence[];
  messages: AgentMessage[];
  claims: Claim[];
  verdict: Verdict | null;
  error: string | null;
  prosecutionPosted: boolean;   // used by classifier to disambiguate CONCEDE
  defensePosted: boolean;
  openedAt: number;
  updatedAt: number;
}

// ── WebSocket event contract served to Arbiter-Live ──────────────────────────

export type BridgeEventType =
  | 'status'
  | 'evidence'
  | 'message'
  | 'claim'
  | 'verdict'
  | 'error'
  | 'snapshot'
  | 'typing';

export interface BridgeEvent {
  type: BridgeEventType;
  payload: unknown;
}

export interface StatusPayload {
  caseId: string;
  phase: CasePhase;
  label: string;
  color: string;
}

export interface EvidencePayload {
  caseId: string;
  items: Evidence[];
}

export interface MessagePayload {
  caseId: string;
  message: AgentMessage;
}

export interface ClaimPayload {
  caseId: string;
  claim: Claim;
}

export interface VerdictPayload {
  caseId: string;
  verdict: Verdict;
  alertName: string;
}

export interface ErrorPayload {
  caseId: string | null;
  message: string;
}

export interface SnapshotPayload {
  caseId: string;
  alertName: string;
  phase: CasePhase;
  evidence: Evidence[];
  messages: AgentMessage[];
  claims: Claim[];
  verdict: Verdict | null;
  error: string | null;
}

export interface TypingPayload {
  active: boolean;
}
