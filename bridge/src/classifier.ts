/**
 * Message classifier that mirrors orchestrator/agent.py heuristics exactly.
 *
 * Priority order (highest first):
 *  1. [SYSTEM_DIAGNOSTICS] → diagnostics (skip)
 *  2. **[ORCHESTRATOR or Orchestrator — Arbiter → orchestrator (skip / status)
 *  3. EVIDENCE_BUNDLE_READY → evidence_bundle
 *  4. TRIAGE_SUPPLEMENT → triage_supplement
 *  5. JUDGE_DICTIONARY opening sentence → verdict
 *  6. Position: line → prosecution or defense
 *  7. [AGENT_ERROR] or ⚠️ Case halted → error
 *  8. Everything else → unknown (skip)
 */

import type { CaseState, VerdictDecision } from './types.js';

export type MessageClass =
  | 'evidence_bundle'
  | 'triage_supplement'
  | 'prosecution'
  | 'defense'
  | 'verdict'
  | 'orchestrator'
  | 'error'
  | 'diagnostics'
  | 'unknown';

// From shared/diagnostics.py and referenced in orchestrator/agent.py
export const DIAGNOSTICS_PREFIX = '[SYSTEM_DIAGNOSTICS]';
export const AGENT_ERROR_PREFIX = '[AGENT_ERROR]';
export const CASE_HALT_MARKER = '⚠️ Case halted';

// Evidence bundle markers from orchestrator/agent.py _BUNDLE_MARKERS
export const BUNDLE_MARKERS = ['"evidence_id"', '"EVD-', 'EVD-'] as const;

/**
 * Verbatim opening sentences from judge/agent.py JUDGE_DICTIONARY.
 * Matching these exactly is authoritative — the Judge is explicitly instructed
 * to open with one of these sentences verbatim.
 */
export const JUDGE_DICTIONARY: Record<VerdictDecision, string> = {
  real_incident:
    'The court has reviewed the digital forensics presented. Let the record reflect that the findings indicate a severe and undeniable breach of protocol. I hereby declare this matter a confirmed incident.',
  false_positive:
    "Upon careful examination of the docket, I find no actionable offense. The prosecution's claims are dismissed as circumstantial at best. The system is hereby exonerated and the alert stricken from the record.",
  escalate_human:
    'The complexity of these arguments exceeds the jurisdiction of an automated bench. The evidence is contradictory, and the potential consequences are too grave. I hereby recuse myself and escalate this trial to a higher human authority.',
  needs_more_evidence:
    'This court cannot render a judgment on hearsay and incomplete logs. The parties have failed to provide the necessary artifacts. I am staying this proceeding until further discovery is submitted.',
};

// Position line patterns from prosecutor/agent.py and defender/agent.py
const PROSECUTION_POSITIONS = ['REAL INCIDENT', 'CONCEDE', 'NEED MORE EVIDENCE'] as const;
const DEFENSE_POSITIONS = ['BENIGN', 'CONCEDE', 'NEED MORE EVIDENCE'] as const;

const POSITION_LINE_RE = /^Position:\s*(.+)$/im;

function extractPosition(text: string): string | null {
  const m = POSITION_LINE_RE.exec(text);
  return m ? m[1].trim().toUpperCase() : null;
}

/**
 * Classify a Band room message by content.
 * Pass the current CaseState so disambiguation of ambiguous "CONCEDE"
 * messages uses live context rather than guesswork.
 */
export function classifyMessage(text: string, state: CaseState | null): MessageClass {
  // 1. Diagnostics — skip entirely
  if (text.includes(DIAGNOSTICS_PREFIX)) return 'diagnostics';

  // 2. Orchestrator routing/status messages — skip (avoid re-parsing their forwarded content)
  if (
    text.includes('**[ORCHESTRATOR') ||
    text.includes('[ORCHESTRATOR') ||
    text.includes('Orchestrator — Arbiter')
  ) {
    return 'orchestrator';
  }

  // 7. Agent errors / case halted — surface before evidence/verdict checks
  if (text.includes(AGENT_ERROR_PREFIX) || text.includes(CASE_HALT_MARKER)) {
    return 'error';
  }

  // 3. Evidence bundle from Triage
  if (text.includes('EVIDENCE_BUNDLE_READY')) return 'evidence_bundle';

  // 4. Triage supplement (re-enrichment after Judge send-back)
  if (text.includes('TRIAGE_SUPPLEMENT')) return 'triage_supplement';

  // 5. Judge verdict — check before Position: lines because the Orchestrator
  //    fallback judge might include both, and the JUDGE_DICTIONARY check is authoritative.
  for (const [decision, sentence] of Object.entries(JUDGE_DICTIONARY)) {
    if (text.includes(sentence)) {
      void decision; // decision used by parseJudgeVerdict, not here
      return 'verdict';
    }
  }

  // 6. Prosecution / Defense position lines
  const position = extractPosition(text);
  if (position) {
    // Unambiguous prosecution positions
    if (
      PROSECUTION_POSITIONS.includes(position as typeof PROSECUTION_POSITIONS[number]) &&
      position !== 'CONCEDE' &&
      position !== 'NEED MORE EVIDENCE'
    ) {
      return 'prosecution'; // REAL INCIDENT
    }

    // Unambiguous defense position
    if (
      DEFENSE_POSITIONS.includes(position as typeof DEFENSE_POSITIONS[number]) &&
      position !== 'CONCEDE' &&
      position !== 'NEED MORE EVIDENCE'
    ) {
      return 'defense'; // BENIGN
    }

    // Ambiguous CONCEDE / NEED MORE EVIDENCE: use state to disambiguate
    if (position === 'CONCEDE' || position === 'NEED MORE EVIDENCE') {
      if (state) {
        // If prosecution has already posted but defense hasn't, treat as prosecution
        if (state.prosecutionPosted && !state.defensePosted) return 'prosecution';
        // Otherwise treat as defense (including when both have posted — either can concede again)
        return 'defense';
      }
      // No state → default to defense (less destructive guess)
      return 'defense';
    }
  }

  return 'unknown';
}
