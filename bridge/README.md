# Arbiter Bridge

A small Node.js/TypeScript service that joins the Arbiter Band room as a
read-mostly relay agent and re-exposes every case as a WebSocket/REST event
stream that Arbiter-Live (the React frontend) can consume.

---

## Architecture decision

The backend is five independent Python agents communicating through a
[Band](https://band.ai) chat room. Band provides a **TypeScript SDK**
(`@thenvoi/sdk`), so the bridge is written entirely in TypeScript — no Python
process required. It uses `GenericAdapter` (no LLM, custom callback logic)
to receive messages without invoking any language model.

---

## Prerequisites

- Node.js **≥ 22**
- A Band account at [app.band.ai](https://app.band.ai)
- The five Arbiter backend agents already running in a Band room

---

## Setup

### 1. Register the bridge agent on Band

1. Go to **Agents → New Agent → Remote Agent** on app.band.ai.
2. Name it `Arbiter Bridge` (or anything that doesn't end with the existing
   handle suffixes `/triage`, `/prosecuter`, `/defender`, `/judge`,
   `/arbiter-orchestrator2`).
3. Copy the **Agent UUID** and **API Key** (shown once).

### 2. Add the bridge to the adjudication room

Open the Arbiter Band room, click **Participants +**, search for your new
bridge agent, and add it. The bridge must be a room participant to receive
messages.

### 3. Configure environment

```bash
cd bridge
cp .env.example .env
# Edit .env and fill in THENVOI_AGENT_ID and THENVOI_API_KEY
```

### 4. Install and run

```bash
npm install
npm run dev       # hot-reload via tsx watch
# or
npm start         # production
```

---

## API reference

### WebSocket — `ws://localhost:4000/ws/case/:caseId`

Connect with the `caseId` (= `alert_id` from the alert JSON, e.g. `ALT-001`).

The bridge immediately sends a **snapshot** event on connect (for
reconnect-resilience), then streams incremental events as they arrive.

#### Event types

| `type`     | `payload` shape                                        |
|------------|-------------------------------------------------------|
| `snapshot` | `{ caseId, alertName, phase, evidence[], messages[], claims[], verdict, error }` |
| `status`   | `{ caseId, phase, label, color }`                    |
| `evidence` | `{ caseId, items: Evidence[] }`                      |
| `message`  | `{ caseId, message: AgentMessage }`                  |
| `claim`    | `{ caseId, claim: Claim }`                           |
| `verdict`  | `{ caseId, verdict: Verdict, alertName }`            |
| `error`    | `{ caseId, message: string }`                        |
| `typing`   | `{ active: boolean }`                                |

### REST

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Liveness probe — `{ ok: true }` |
| `GET`  | `/cases` | List all active case snapshots |
| `GET`  | `/case/:caseId` | Full snapshot for one case |
| `POST` | `/case` | Post an Alert JSON to the Band room to start a new case |

#### `POST /case` body

```json
{
  "alert_id": "ALT-001",
  "source": "IDS",
  "rule_name": "PORT_SCAN_DETECTED",
  "timestamp": "2026-06-15T08:03:12Z",
  "asset_id": "srv-web-prod-01",
  "asset_criticality": "high",
  "raw_payload": { "...": "..." }
}
```

---

## Evidence types used by the bridge

| Field | Source |
|-------|--------|
| `evidence_id` | Triage JSON — authoritative, parsed directly |
| `fact` | Triage JSON — authoritative |
| `source_type` | Triage JSON — authoritative |
| `confidence` | Triage JSON — authoritative (0–1 float) |
| `raw_ref` | Triage JSON — authoritative |
| `citedBy` | Derived: populated when Prosecutor/Defender cite the ID |

---

## Frontend integration

Set these vars in `Arbiter-Live/.env.local` (development):

```
VITE_DEMO_MODE=false
VITE_WS_URL=ws://localhost:4000/ws/case
VITE_API_URL=http://localhost:4000
```

For production, deploy the bridge and update `VITE_WS_URL` /
`VITE_API_URL` to the deployed URLs.

The frontend's `useAgentStream.ts` connects to
`${VITE_WS_URL}/${caseId}` and fetches `${VITE_API_URL}/case/${caseId}`
as an initial snapshot before relying on the stream.

---

## See also

`INTEGRATION_NOTES.md` in the root of Arbiter-Live — documents every
approximation made when parsing backend output.
