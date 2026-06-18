/**
 * Band agent that joins the Arbiter adjudication room as a read-mostly relay.
 *
 * Uses @thenvoi/sdk GenericAdapter (no LLM required) to receive every room
 * message, classify it, update in-memory CaseState, and broadcast BridgeEvents
 * to all WebSocket subscribers.
 *
 * Registration: create a Remote Agent on app.band.ai, name it something like
 * "Arbiter Bridge", add it to the adjudication room via Participants +, and
 * set THENVOI_AGENT_ID + THENVOI_API_KEY in the bridge .env.
 */

import { Agent, GenericAdapter, loadAgentConfigFromEnv } from '@thenvoi/sdk';
import type { AdapterToolsProtocol } from '@thenvoi/sdk';
import { classifyMessage, AGENT_ERROR_PREFIX, CASE_HALT_MARKER } from './classifier.js';
import { parseEvidenceBundle, parseTriageSupplement, parseAlert } from './parsers/evidence.js';
import { parseCounselMessage, deriveClaim } from './parsers/counsel.js';
import { parseJudgeVerdict } from './parsers/judge.js';
import {
  openCase,
  findActiveCase,
  getCase,
  addEvidence,
  addMessage,
  addClaim,
  setVerdict,
  setError,
  updatePhase,
  buildSnapshot,
} from './state.js';
import {
  broadcast,
  registerPostAlertCallback,
  PHASE_COLORS,
  PHASE_LABELS,
} from './server.js';
import type { BridgeEvent, AgentRole } from './types.js';

let msgCounter = 0;
function nextId(): string {
  return `msg-${++msgCounter}`;
}

function statusEvent(caseId: string): BridgeEvent {
  const state = getCase(caseId);
  if (!state) return { type: 'status', payload: { caseId, phase: 'open', label: 'CASE OPENED', color: PHASE_COLORS['open'] } };
  return {
    type: 'status',
    payload: {
      caseId,
      phase: state.phase,
      label: PHASE_LABELS[state.phase],
      color: PHASE_COLORS[state.phase],
    },
  };
}

async function handleMessage(
  rawText: string,
  tools: AdapterToolsProtocol,
): Promise<void> {
  // Best-effort: find active case so we can classify CONCEDE messages correctly
  const activeCase = findActiveCase();
  const msgClass = classifyMessage(rawText, activeCase ?? null);

  if (msgClass === 'diagnostics') return;

  // ── Check if this is a plain alert JSON (new case initiation) ─────────────
  // Must happen before skipping 'unknown' so alert messages aren't dropped.
  if (msgClass === 'unknown') {
    const alertMeta = parseAlert(rawText);
    if (alertMeta) {
      const state = openCase(alertMeta.alert_id, alertMeta.rule_name);
      updatePhase(state.caseId, 'triage');
      broadcast(state.caseId, statusEvent(state.caseId));
    }
    return;
  }

  // ── Orchestrator routing / status messages ─────────────────────────────────
  if (msgClass === 'orchestrator') {
    // Detect phase transitions from Orchestrator banner text
    if (rawText.includes('EvidenceBundle received') || rawText.includes('EVIDENCE_BUNDLE_READY')) {
      // Orchestrator acknowledged bundle — case moves to debate phase implicitly
    }
    // Don't re-parse forwarded content; just skip
    return;
  }

  // ── Agent error / case halt ────────────────────────────────────────────────
  if (msgClass === 'error') {
    const target = activeCase ?? findActiveCase();
    const caseId = target?.caseId ?? 'unknown';
    setError(caseId, rawText);
    const errorEvent: BridgeEvent = {
      type: 'error',
      payload: { caseId, message: rawText },
    };
    broadcast(caseId, errorEvent);
    broadcast(caseId, statusEvent(caseId));
    return;
  }

  // ── Evidence bundle from Triage ────────────────────────────────────────────
  if (msgClass === 'evidence_bundle') {
    const result = parseEvidenceBundle(rawText);
    if (!result) {
      console.warn('[bridge] Failed to parse EVIDENCE_BUNDLE_READY JSON');
      return;
    }

    // Ensure case exists (Orchestrator may or may not have posted the alert first)
    let state = getCase(result.bundle.alert_id) ?? openCase(result.bundle.alert_id, result.bundle.alert_id);
    state.bundle = result.bundle;
    addEvidence(state.caseId, result.evidence);
    updatePhase(state.caseId, 'debate');

    const evEvent: BridgeEvent = {
      type: 'evidence',
      payload: { caseId: state.caseId, items: result.evidence },
    };
    broadcast(state.caseId, evEvent);
    broadcast(state.caseId, statusEvent(state.caseId));
    return;
  }

  // ── Triage supplement ──────────────────────────────────────────────────────
  if (msgClass === 'triage_supplement') {
    const newItems = parseTriageSupplement(rawText);
    if (newItems.length === 0) return;

    const state = activeCase;
    if (!state) return;

    addEvidence(state.caseId, newItems);
    const evEvent: BridgeEvent = {
      type: 'evidence',
      payload: { caseId: state.caseId, items: newItems },
    };
    broadcast(state.caseId, evEvent);
    return;
  }

  // ── Prosecution argument ───────────────────────────────────────────────────
  if (msgClass === 'prosecution') {
    const state = activeCase;
    if (!state) return;

    const { message } = parseCounselMessage(rawText, 'prosecutor', nextId());
    addMessage(state.caseId, message);
    const claim = deriveClaim(message, `P-${String(state.claims.length + 1).padStart(3, '0')}`);
    addClaim(state.caseId, claim);

    broadcast(state.caseId, { type: 'message', payload: { caseId: state.caseId, message } });
    broadcast(state.caseId, { type: 'claim', payload: { caseId: state.caseId, claim } });
    return;
  }

  // ── Defense argument ───────────────────────────────────────────────────────
  if (msgClass === 'defense') {
    const state = activeCase;
    if (!state) return;

    const { message } = parseCounselMessage(rawText, 'defender', nextId());
    addMessage(state.caseId, message);
    const claim = deriveClaim(message, `D-${String(state.claims.filter(c => c.agent === 'defender').length + 1).padStart(3, '0')}`);
    addClaim(state.caseId, claim);

    broadcast(state.caseId, { type: 'message', payload: { caseId: state.caseId, message } });
    broadcast(state.caseId, { type: 'claim', payload: { caseId: state.caseId, claim } });
    return;
  }

  // ── Judge verdict ──────────────────────────────────────────────────────────
  if (msgClass === 'verdict') {
    const state = activeCase;
    if (!state) return;

    updatePhase(state.caseId, 'judging');
    broadcast(state.caseId, statusEvent(state.caseId));

    // Emit the full Judge prose as a verdict-type message first (shows in debate feed)
    const judgeMsg = {
      id: nextId(),
      agent: 'judge' as AgentRole,
      type: 'verdict' as const,
      text: rawText,
      evidenceCited: [] as string[],
      mitre: [] as string[],
      timestamp: new Date().toISOString(),
    };
    addMessage(state.caseId, judgeMsg);
    broadcast(state.caseId, { type: 'message', payload: { caseId: state.caseId, message: judgeMsg } });

    const verdict = parseJudgeVerdict(rawText);
    if (!verdict) {
      console.warn('[bridge] Failed to parse judge verdict from:', rawText.slice(0, 200));
      return;
    }

    setVerdict(state.caseId, verdict);
    const newState = getCase(state.caseId)!;

    broadcast(state.caseId, {
      type: 'verdict',
      payload: { caseId: state.caseId, verdict, alertName: state.alertName },
    });
    broadcast(state.caseId, statusEvent(state.caseId));
    return;
  }
}

// ── Band REST API helpers ─────────────────────────────────────────────────────
//
// Used by POST /case to send an alert directly via REST without depending on
// agentTools (which is only populated after the first incoming WS message).

const BAND_REST = 'https://app.band.ai/api/v1/agent';

interface BandParticipant {
  id: string;
  name: string;
  handle: string;
}

async function bandGet<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BAND_REST}${path}`, {
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Band REST ${path} → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function bandPost(path: string, apiKey: string, body: unknown): Promise<void> {
  const res = await fetch(`${BAND_REST}${path}`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Band REST POST ${path} → ${res.status}: ${await res.text()}`);
}

/**
 * Post an alert JSON to the Band room via REST, mentioning the Orchestrator so
 * it receives the message and opens the case.
 *
 * Band requires at least one @mention for messages to be routed to agents.
 * The Orchestrator's handle ends with /arbiter-orchestrator2 (from
 * orchestrator/agent.py _AGENT_HANDLE_SUFFIXES).
 */
async function postAlertViaRest(alertJson: string, roomId: string, apiKey: string): Promise<void> {
  // Fetch room participants to find the Orchestrator
  interface ParticipantsResponse { participants?: BandParticipant[]; data?: BandParticipant[] }
  const resp = await bandGet<ParticipantsResponse>(
    `/chats/${roomId}/participants`,
    apiKey,
  );
  const participants: BandParticipant[] = resp.participants ?? resp.data ?? [];

  const orchestrator = participants.find((p) =>
    (p.handle ?? '').endsWith('/arbiter-orchestrator2'),
  );

  if (!orchestrator) {
    throw new Error(
      'Orchestrator agent not found in room participants. ' +
        'Make sure the agent whose handle ends with /arbiter-orchestrator2 is in the room.',
    );
  }

  // Band message API: content must include the @mention text; mentions array provides routing
  const mentionHandle = orchestrator.handle.startsWith('@')
    ? orchestrator.handle
    : `@${orchestrator.handle}`;

  await bandPost(`/chats/${roomId}/messages`, apiKey, {
    message: {
      content: `${mentionHandle} ${alertJson}`,
      mentions: [
        { id: orchestrator.id, name: orchestrator.name, handle: orchestrator.handle },
      ],
    },
  });

  console.log(`[bridge] Alert posted to room ${roomId}, mentioning ${orchestrator.handle}`);
}

// ── Agent entry point ─────────────────────────────────────────────────────────

export async function startBandAgent(): Promise<{ postMessage: (text: string) => Promise<void> }> {
  const config = loadAgentConfigFromEnv();

  const apiKey = process.env['THENVOI_API_KEY'] ?? '';
  const roomId = process.env['THENVOI_ROOM_ID'] ?? '';

  const agent = Agent.create({
    adapter: new GenericAdapter(async ({ message, tools }) => {
      const text: string =
        typeof (message as { content?: unknown }).content === 'string'
          ? (message as { content: string }).content
          : String(message);
      await handleMessage(text, tools);
    }),
    config,
  });

  // Register the callback that lets POST /case send an alert to the room.
  // Uses Band REST API directly — no dependency on agentTools being set.
  registerPostAlertCallback(async (alertJson: string) => {
    if (!roomId) {
      throw new Error(
        'THENVOI_ROOM_ID is not set. Add it to bridge/.env (copy from the Band room URL).',
      );
    }
    await postAlertViaRest(alertJson, roomId, apiKey);
  });

  // Run in background — doesn't block
  agent.run().catch((err: unknown) => {
    console.error('[bridge] Band agent error:', err);
    process.exit(1);
  });

  console.log('[bridge] Band agent connecting…');

  return {
    postMessage: async (text: string) => {
      if (!roomId) throw new Error('THENVOI_ROOM_ID not set');
      await postAlertViaRest(text, roomId, apiKey);
    },
  };
}
