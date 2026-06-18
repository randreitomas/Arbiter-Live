/**
 * Evidence parser: extracts EvidenceBundle from Triage messages.
 *
 * Triage emits one of:
 *   EVIDENCE_BUNDLE_READY\n{JSON EvidenceBundle per triage/schemas.py}
 *   TRIAGE_SUPPLEMENT\n{JSON TriageSupplementRequest + evidence list}
 *
 * The JSON is valid — no LLM-prose parsing required here. Trust it directly.
 */

import type { Evidence, EvidenceBundle, EvidenceSourceType } from '../types.js';

const VALID_SOURCE_TYPES = new Set<EvidenceSourceType>([
  'raw_log',
  'cmdb',
  'baseline',
  'geo',
  'lineage',
  'mitre',
]);

function coerceSourceType(v: unknown): EvidenceSourceType {
  if (typeof v === 'string' && VALID_SOURCE_TYPES.has(v as EvidenceSourceType)) {
    return v as EvidenceSourceType;
  }
  return 'raw_log'; // safe fallback
}

function parseEvidence(raw: unknown): Evidence | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const evidence_id = typeof r['evidence_id'] === 'string' ? r['evidence_id'] : null;
  const fact = typeof r['fact'] === 'string' ? r['fact'] : null;
  if (!evidence_id || !fact) return null;
  return {
    evidence_id,
    fact,
    source_type: coerceSourceType(r['source_type']),
    confidence: typeof r['confidence'] === 'number' ? Math.max(0, Math.min(1, r['confidence'])) : 0,
    raw_ref: typeof r['raw_ref'] === 'string' ? r['raw_ref'] : null,
    citedBy: [],
  };
}

/**
 * Extract the JSON blob that follows a marker keyword on a new line.
 * e.g. "EVIDENCE_BUNDLE_READY\n{...}"
 */
function extractJsonAfterMarker(text: string, marker: string): unknown | null {
  const markerIdx = text.indexOf(marker);
  if (markerIdx === -1) return null;
  const afterMarker = text.slice(markerIdx + marker.length).trimStart();
  const start = afterMarker.indexOf('{');
  if (start === -1) return null;
  try {
    const [parsed] = [JSON.parse(afterMarker.slice(start))]; // throws on bad JSON
    return parsed;
  } catch {
    return null;
  }
}

export interface ParsedBundle {
  bundle: EvidenceBundle;
  evidence: Evidence[];
}

export function parseEvidenceBundle(text: string): ParsedBundle | null {
  const raw = extractJsonAfterMarker(text, 'EVIDENCE_BUNDLE_READY');
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const bundle_id = typeof r['bundle_id'] === 'string' ? r['bundle_id'] : `bundle-${Date.now()}`;
  const alert_id = typeof r['alert_id'] === 'string' ? r['alert_id'] : 'unknown';
  const rawItems = Array.isArray(r['evidence']) ? r['evidence'] : [];

  const evidence: Evidence[] = [];
  for (const item of rawItems) {
    const ev = parseEvidence(item);
    if (ev) evidence.push(ev);
  }

  const bundle: EvidenceBundle = {
    bundle_id,
    alert_id,
    schema_version: '1.0',
    generated_at: typeof r['generated_at'] === 'string' ? r['generated_at'] : new Date().toISOString(),
    alert_type: typeof r['alert_type'] === 'string' ? r['alert_type'] : 'EDR',
    asset_criticality:
      typeof r['asset_criticality'] === 'string' ? r['asset_criticality'] : 'medium',
    evidence,
    mitre_candidates: Array.isArray(r['mitre_candidates'])
      ? (r['mitre_candidates'] as string[]).filter((s) => typeof s === 'string')
      : [],
    open_questions: Array.isArray(r['open_questions'])
      ? (r['open_questions'] as string[]).filter((s) => typeof s === 'string')
      : [],
  };

  return { bundle, evidence };
}

/**
 * Parse a TRIAGE_SUPPLEMENT message and extract any new evidence items.
 * Supplements add evidence to the bundle but don't replace it.
 */
export function parseTriageSupplement(text: string): Evidence[] {
  const raw = extractJsonAfterMarker(text, 'TRIAGE_SUPPLEMENT');
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  const rawItems = Array.isArray(r['evidence']) ? r['evidence'] : [];
  return rawItems.map(parseEvidence).filter((e): e is Evidence => e !== null);
}

/**
 * Parse an Alert JSON pasted directly into the room.
 */
export function parseAlert(text: string): { alert_id: string; rule_name: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) {
    const start = trimmed.indexOf('{');
    if (start === -1) return null;
    try {
      const r = JSON.parse(trimmed.slice(start)) as Record<string, unknown>;
      if (typeof r['alert_id'] === 'string' && typeof r['rule_name'] === 'string') {
        return { alert_id: r['alert_id'], rule_name: r['rule_name'] };
      }
    } catch {
      return null;
    }
  }
  try {
    const r = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof r['alert_id'] === 'string' && typeof r['rule_name'] === 'string') {
      return { alert_id: r['alert_id'], rule_name: r['rule_name'] };
    }
  } catch {
    return null;
  }
  return null;
}
