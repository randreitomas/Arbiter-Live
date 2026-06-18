/**
 * Judge verdict parser.
 *
 * The Judge is explicitly instructed (judge/agent.py SYSTEM_PROMPT step 6) to:
 *   - NEVER output JSON, bullet lists, or key/value pairs.
 *   - Open with the verbatim JUDGE_DICTIONARY sentence (authoritative verdict detection).
 *   - State severity (low/medium/high/critical) in paragraph 3.
 *   - State confidence qualitatively (e.g. "I hold this with high confidence").
 *   - Close with whether human approval is required.
 *
 * APPROXIMATIONS (documented in INTEGRATION_NOTES.md):
 *   - Confidence band: keyword search over prose; never a guaranteed percentage.
 *   - Implied actions: best-effort keyword extraction; not a structured list.
 *   - Struck claims: only detectable when prose explicitly names them.
 */

import type {
  Verdict,
  VerdictDecision,
  VerdictSeverity,
  VerdictConfidence,
} from '../types.js';
import { JUDGE_DICTIONARY } from '../classifier.js';

const EVD_ID_RE = /EVD-[0-9a-f]{6}-\d{3}/gi;

// ── Verdict decision ─────────────────────────────────────────────────────────

export function detectDecision(text: string): VerdictDecision | null {
  for (const [decision, sentence] of Object.entries(JUDGE_DICTIONARY)) {
    if (text.includes(sentence)) return decision as VerdictDecision;
  }
  return null;
}

// ── Severity ─────────────────────────────────────────────────────────────────
//
// Judge prompt step 4 instructs: "State the severity you assigned (low / medium /
// high / critical)". We search for these words near "severity" or in that paragraph.
// Approximation: could false-positive on "high confidence" if word appears before "severity".
// We search for severity-adjacent patterns first.

const SEVERITY_ADJACENT_RE =
  /severity[^.]{0,40}?\b(critical|high|medium|low)\b|I\s+(?:assign|rate|score|find|consider)[^.]{0,40}?\b(critical|high|medium|low)\b|\b(critical|high|medium|low)\b[^.]{0,40}?severity/i;

const SEVERITY_FALLBACK_RE = /\b(critical|high|medium|low)\b/i;

export function extractSeverity(text: string): VerdictSeverity | null {
  const m =
    SEVERITY_ADJACENT_RE.exec(text) ?? SEVERITY_FALLBACK_RE.exec(text);
  if (!m) return null;
  const word = (m[1] ?? m[2] ?? m[3] ?? '').toLowerCase();
  if (word === 'critical' || word === 'high' || word === 'medium' || word === 'low') {
    return word as VerdictSeverity;
  }
  return null;
}

// ── Confidence ───────────────────────────────────────────────────────────────
//
// Judge prompt instructs: "state your confidence in plain words (e.g. 'I hold this
// with high confidence')". We search for qualitative phrases.
// Approximation: qualitative bands only — no numeric percentage exists.

const CONFIDENCE_RE =
  /with\s+(very\s+high|high|medium|low)\s+confidence|I\s+hold\s+this\s+with\s+(very\s+high|high|medium|low)\s+confidence|\b(very\s+high|high|medium|low)\s+confidence/i;

export function extractConfidence(text: string): VerdictConfidence {
  const m = CONFIDENCE_RE.exec(text);
  if (!m) return 'unknown';
  const raw = (m[1] ?? m[2] ?? m[3] ?? '').toLowerCase().replace(/\s+/g, '_');
  switch (raw) {
    case 'very_high':
      return 'very_high';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'unknown';
  }
}

// ── Human approval ───────────────────────────────────────────────────────────
//
// Judge prompt step 5: "state clearly whether this disposition requires human
// approval before any action is taken". We search for these phrases.

const APPROVAL_RE =
  /requires?\s+human\s+(?:sign-off|approval)|human\s+(?:approval|sign-off)\s+(?:is\s+)?required|nothing\s+destructive\s+(?:will|shall|should)\s+execute/i;

export function detectHumanApproval(text: string): boolean {
  return APPROVAL_RE.test(text);
}

// ── Evidence citations ───────────────────────────────────────────────────────

export function extractEvidenceCited(text: string): string[] {
  return [...new Set((text.match(EVD_ID_RE) ?? []).map((s) => s.toUpperCase()))];
}

// ── Implied actions ──────────────────────────────────────────────────────────
//
// Judge prompt step 5: "name the implied action in reasoning" as prose, e.g.
// "isolating the host" / "disabling a credential". We extract the sentence(s)
// that contain these action phrases as best-effort free text.
// Approximation: may miss actions phrased unusually — see INTEGRATION_NOTES.md.

const ACTION_KEYWORDS_RE =
  /\b(isolat(?:e|ing|ion)|disabl(?:e|ing)|block(?:ing)?|quarantin(?:e|ing)|revok(?:e|ing)|reset(?:ting)?|contain(?:ment|ing)?|suspend(?:ing)?|remov(?:e|ing))\b/i;

export function extractImpliedActions(text: string): string | null {
  // Find sentences containing action language
  const sentences = text.split(/(?<=[.!?])\s+/);
  const actionSentences = sentences.filter((s) => ACTION_KEYWORDS_RE.test(s));
  if (actionSentences.length === 0) return null;
  return actionSentences.join(' ');
}

// ── Main entry point ─────────────────────────────────────────────────────────

export function parseJudgeVerdict(text: string): Verdict | null {
  const decision = detectDecision(text);
  if (!decision) return null;

  return {
    decision,
    severity: extractSeverity(text),
    confidence: extractConfidence(text),
    reasoning: text, // full prose — not bullet-split
    evidenceCited: extractEvidenceCited(text),
    requiresHumanApproval: detectHumanApproval(text),
    impliedActions: extractImpliedActions(text),
  };
}
