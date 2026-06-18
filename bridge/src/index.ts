/**
 * Arbiter Bridge — entry point.
 *
 * Starts:
 *   1. HTTP + WebSocket server (Express + ws)
 *   2. Band agent (relay participant in the adjudication room)
 *
 * Environment variables (see .env.example):
 *   THENVOI_AGENT_ID  — Band agent UUID for the bridge
 *   THENVOI_API_KEY   — Band API key for the bridge
 *   PORT              — HTTP/WS server port (default 4000)
 */

import 'dotenv/config';
import { createServer } from './server.js';
import { startBandAgent } from './band-agent.js';

const PORT = Number(process.env['PORT'] ?? 4000);

const required = ['THENVOI_AGENT_ID', 'THENVOI_API_KEY', 'THENVOI_ROOM_ID'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `[bridge] Missing required env vars: ${missing.join(', ')}\n` +
      `         Copy bridge/.env.example → bridge/.env and fill in your credentials.`,
  );
  process.exit(1);
}

createServer(PORT);
await startBandAgent();
