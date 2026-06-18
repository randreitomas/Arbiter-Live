/**
 * HTTP + WebSocket server.
 *
 * WebSocket endpoint:   ws://localhost:PORT/ws/case/:caseId
 *   Pushes BridgeEvents as JSON. Clients reconnect and receive a snapshot on join.
 *
 * REST endpoints:
 *   GET  /health             → { ok: true }
 *   GET  /cases              → list of active case snapshots
 *   GET  /case/:caseId       → full snapshot for one case (reconnect-resilient)
 *   POST /case               → accept an Alert JSON body and forward it to the Band room
 */

import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import type { BridgeEvent, SnapshotPayload, CasePhase } from './types.js';
import {
  getCase,
  getAllCases,
  buildSnapshot,
} from './state.js';

// ── Phase → UI colour mapping ────────────────────────────────────────────────

export const PHASE_COLORS: Record<CasePhase, string> = {
  open: '#64748b',
  triage: '#60a5fa',
  debate: '#a78bfa',
  judging: '#f59e0b',
  awaiting_approval: '#f59e0b',
  closed: '#4ade80',
  error: '#f87171',
};

export const PHASE_LABELS: Record<CasePhase, string> = {
  open: 'CASE OPENED',
  triage: 'EVIDENCE COLL.',
  debate: 'AGENT DEBATE',
  judging: 'DELIBERATING',
  awaiting_approval: 'AWAITING APPROVAL',
  closed: 'CASE CLOSED',
  error: 'AGENT ERROR',
};

// ── Per-case subscriber set ──────────────────────────────────────────────────

const subscribers = new Map<string, Set<WebSocket>>();

function getSubscribers(caseId: string): Set<WebSocket> {
  if (!subscribers.has(caseId)) subscribers.set(caseId, new Set());
  return subscribers.get(caseId)!;
}

function removeSubscriber(caseId: string, ws: WebSocket): void {
  subscribers.get(caseId)?.delete(ws);
}

// ── Broadcast helpers ────────────────────────────────────────────────────────

export function broadcast(caseId: string, event: BridgeEvent): void {
  const msg = JSON.stringify(event);
  for (const ws of getSubscribers(caseId)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

export function broadcastToAll(event: BridgeEvent): void {
  const msg = JSON.stringify(event);
  for (const subs of subscribers.values()) {
    for (const ws of subs) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }
}

// ── Bridge callback: called by band-agent.ts when a new case starts ──────────

let _postAlertToRoom: ((alertJson: string) => Promise<void>) | null = null;

export function registerPostAlertCallback(fn: (alertJson: string) => Promise<void>): void {
  _postAlertToRoom = fn;
}

// ── Express app ──────────────────────────────────────────────────────────────

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  app.get('/cases', (_req, res) => {
    res.json(getAllCases().map(buildSnapshot));
  });

  app.get('/case/:caseId', (req, res) => {
    const state = getCase(req.params['caseId'] ?? '');
    if (!state) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json(buildSnapshot(state));
  });

  app.post('/case', async (req, res) => {
    if (!_postAlertToRoom) {
      res.status(503).json({ error: 'Bridge not connected to Band yet' });
      return;
    }
    const body = req.body as Record<string, unknown>;
    if (!body['alert_id'] || !body['rule_name']) {
      res.status(400).json({ error: 'Body must include alert_id and rule_name' });
      return;
    }
    try {
      await _postAlertToRoom(JSON.stringify(body));
      res.json({ ok: true, alert_id: body['alert_id'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  return app;
}

// ── HTTP + WS server ─────────────────────────────────────────────────────────

export function createServer(port: number) {
  const app = createApp();
  const httpServer = http.createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: undefined });

  wss.on('connection', (ws, req) => {
    // Extract caseId from path: /ws/case/:caseId
    const url = req.url ?? '';
    const match = /\/ws\/case\/([^/?]+)/.exec(url);
    const caseId = match ? match[1] : null;

    if (!caseId) {
      ws.close(1008, 'Missing caseId in path. Use /ws/case/:caseId');
      return;
    }

    getSubscribers(caseId).add(ws);

    // Send snapshot immediately so the client has full state on connect/reconnect
    const state = getCase(caseId);
    if (state) {
      const snapshot: SnapshotPayload = buildSnapshot(state);
      ws.send(JSON.stringify({ type: 'snapshot', payload: snapshot }));
    }

    ws.on('close', () => removeSubscriber(caseId, ws));
    ws.on('error', () => removeSubscriber(caseId, ws));
  });

  httpServer.listen(port, () => {
    console.log(`[bridge] HTTP + WS server listening on port ${port}`);
    console.log(`[bridge]   REST  → http://localhost:${port}`);
    console.log(`[bridge]   WS    → ws://localhost:${port}/ws/case/:caseId`);
  });

  return { httpServer, wss };
}
