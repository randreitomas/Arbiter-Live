/**
 * Counsel parser: extracts structured data from Prosecutor and Defender prose.
 *
 * Real agent output format (confirmed from agent prompts):
 *   Position: REAL INCIDENT   ← Prosecutor opening line
 *   Position: BENIGN          ← Defender opening line
 *   Position: CONCEDE         ← either agent conceding
 *   Position: NEED MORE EVIDENCE ← either agent requesting re-triage
 *
 * Followed by 2–4 sentences citing EVD-xxxxxx-NNN tokens inline, e.g.:
 *   "...access rights 0x1FFFFF (EVD-900ccf-005) indicate T1003.001 usage."
 */

import type { AgentMessage, AgentRole, AgentMessageType } from '../types.js';

// EVD-[0-9a-f]{6}-\d{3} — matches triage/schemas.py Evidence.evidence_id pattern
const EVD_ID_RE = /EVD-[0-9a-f]{6}-\d{3}/gi;

// MITRE technique IDs: T1234 or T1234.001
const MITRE_RE = /\bT\d{4}(?:\.\d{3})?\b/g;

const POSITION_LINE_RE = /^Position:\s*(.+)$/im;

function mapPositionToType(position: string): AgentMessageType {
  const p = position.toUpperCase();
  if (p === 'CONCEDE') return 'concede';
  return 'argument';
}

function deriveRole(position: string): AgentRole {
  const p = position.toUpperCase();
  if (p === 'REAL INCIDENT' || p === 'NEED MORE EVIDENCE') return 'prosecutor';
  if (p === 'BENIGN') return 'defender';
  // CONCEDE is ambiguous — caller provides the role
  return 'prosecutor';
}

export interface ParsedCounselMessage {
  message: AgentMessage;
}

/**
 * Parse a Prosecutor or Defender prose message.
 *
 * @param text    The raw message text from the Band room.
 * @param role    Resolved agent role (caller must determine this from state/classifier).
 * @param msgId   Unique message identifier.
 */
export function parseCounselMessage(
  text: string,
  role: 'prosecutor' | 'defender',
  msgId: string,
): ParsedCounselMessage {
  const positionMatch = POSITION_LINE_RE.exec(text);
  const position = positionMatch ? positionMatch[1].trim().toUpperCase() : undefined;

  const type = position ? mapPositionToType(position) : 'argument';

  // Extract all EVD-* citations
  const evidenceCited = [...new Set((text.match(EVD_ID_RE) ?? []).map((s) => s.toUpperCase()))];

  // Extract all MITRE technique IDs
  const mitre = [...new Set((text.match(MITRE_RE) ?? []))];

  // Use full text as the message body — the Position: line is included
  const message: AgentMessage = {
    id: msgId,
    agent: role,
    type,
    text,
    position,
    evidenceCited,
    mitre,
    timestamp: new Date().toISOString(),
  };

  return { message };
}

/**
 * Derive a Claim from a parsed counsel message.
 * Each Prosecutor/Defender message is treated as one claim whose status is:
 *   - 'concede' when the agent's own position line says CONCEDE
 *   - 'valid' otherwise (the Judge may retroactively mark claims as 'struck',
 *     but that is only detectable from the Judge's prose — see judge.ts)
 */
export function deriveClaim(
  message: AgentMessage,
  claimId: string,
): import('../types.js').Claim {
  // Use first non-empty line after Position: as the claim text, or full text
  const lines = message.text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bodyLines = lines.filter((l) => !l.startsWith('Position:'));
  const claimText = bodyLines[0] ?? message.text.slice(0, 120);

  return {
    id: claimId,
    agent: message.agent as 'prosecutor' | 'defender',
    status: message.type === 'concede' ? 'concede' : 'valid',
    text: claimText,
    evidenceIds: message.evidenceCited,
  };
}
