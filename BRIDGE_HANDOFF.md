# Arbiter Bridge — Handoff & Testing Guide

Everything that was built, what changed, and exactly how to test it once the backend agents are back online.

---

## What Was Built

### New: `bridge/` service

A standalone Node.js/TypeScript service that joins the Arbiter Band room as a relay agent and streams live case data to the browser dashboard.

```
bridge/
├── .env.example          ← credentials template (fill in → .env)
├── .env                  ← your actual credentials (already filled in)
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts          ← entry point, validates env vars, starts server + agent
    ├── band-agent.ts     ← joins Band room, classifies messages, broadcasts events
    ├── classifier.ts     ← message classification (mirrors orchestrator/agent.py logic)
    ├── state.ts          ← in-memory CaseState per alert_id
    ├── server.ts         ← Express HTTP + WebSocket server on port 4000
    └── parsers/
        ├── evidence.ts   ← parses EVIDENCE_BUNDLE_READY JSON from Triage
        ├── counsel.ts    ← parses Prosecutor/Defender prose (Position: line + EVD-* IDs)
        └── judge.ts      ← parses Judge verdict prose (JUDGE_DICTIONARY matching)
```

**API it exposes:**

| Method | URL | What it does |
|--------|-----|--------------|
| `WS` | `ws://localhost:4000/ws/case/:caseId` | Streams case events live to the browser |
| `GET` | `http://localhost:4000/case/:caseId` | Full case snapshot (safe to call on reconnect) |
| `GET` | `http://localhost:4000/cases` | Lists all active cases |
| `POST` | `http://localhost:4000/case` | Posts an Alert JSON into the Band room |

---

## What Changed in the Frontend (`Arbiter-Live/`)

### `src/types/index.ts` — Updated to match real backend contract

| Field | Before | After | Why |
|-------|--------|-------|-----|
| `Evidence.id` | `string` | `evidence_id: string` | Matches `triage/schemas.py` field name |
| `Evidence.text` | `string` | `fact: string` | Matches `triage/schemas.py` field name |
| — | missing | `source_type`, `confidence` (0–1), `raw_ref` | Real Triage JSON fields |
| `AgentMessage.mitre` | `string` (single) | `string[]` (array) | Agents can cite multiple techniques |
| `AgentMessage.type` | includes `'rebuttal'` | removed `'rebuttal'` | No reliable signal for it in real output |
| `Verdict.decision` | `'REAL INCIDENT' \| 'FALSE POSITIVE' \| 'INVESTIGATE'` | `'real_incident' \| 'false_positive' \| 'escalate_human' \| 'needs_more_evidence'` | Matches `judge/agent.py` JUDGE_DICTIONARY keys exactly |
| `Verdict.confidence` | `"94%"` (fake string) | `'low' \| 'medium' \| 'high' \| 'very_high' \| 'unknown'` | Judge never outputs a number |
| `Verdict.reasoning` | `string[]` (bullet list) | `string` (full prose) | Judge writes paragraphs, not bullet points |
| `Verdict.recommendedActions` | structured list | removed → `impliedActions: string \| null` | No structured action list exists in backend |
| `Claim.madeBy` | — | `agent: 'prosecutor' \| 'defender'` | Renamed for clarity |

### `src/data/demoScenarios.ts`
Fully migrated to new field names. All three demo scenarios still work exactly as before — demo mode is unchanged.

### `src/store/caseStore.ts`
- Added `caseError: string | null` state field
- Added `setCaseError()` action

### `src/hooks/useAgentStream.ts`
- Live mode now fetches a **REST snapshot** first on connect (so refresh doesn't lose state)
- Handles all new bridge event types: `snapshot`, `error`, `verdict` (auto-opens approval modal)
- Exports `postAlertToLive()` helper used by the new case panel
- Demo mode is **fully unchanged**

### `src/components/EvidencePanel.tsx`
- Uses `evidence_id` and `fact` instead of `id` and `text`
- Shows `source_type` and `confidence %` per evidence item

### `src/components/DebateFeed.tsx`
- `mitre` renders as array (`T1003 · T1078`)
- Uses `id` field as React key (more stable)

### `src/components/JudgePanel.tsx`
- Verdict decision uses new enum with proper labels/colors (including `ESCALATE TO HUMAN` and `NEEDS MORE EVIDENCE`)
- Reasoning displayed as full prose (not bullet list)
- Shows "IMPLIED ACTIONS" box when the Judge mentioned any action language

### `src/components/ApprovalModal.tsx`
- Removed fake `RecommendedAction` checkbox list
- Shows implied actions text (labeled as best-effort)
- Shows full Judge ruling prose so reviewer can read exactly what the Judge wrote
- **Approve/Reject gate is preserved** — nothing closes without human decision

### `src/pages/DashboardPage.tsx`
- In **live mode**: `+ NEW CASE` button appears in the nav → opens a textarea to paste Alert JSON → submits to bridge
- **Agent error banner** appears if `[AGENT_ERROR]` / case-halt arrives from backend
- Demo mode selectors are hidden in live mode, shown only in demo mode

### New files
- `INTEGRATION_NOTES.md` — documents every approximation (confidence extraction, implied actions, struck claims)
- `BRIDGE_HANDOFF.md` — this file

### `bridge/.env`
- `THENVOI_AGENT_ID` ✅ filled in
- `THENVOI_API_KEY` ✅ filled in
- `THENVOI_ROOM_ID` ✅ filled in (`3fdd48b8-ccda-4b56-a813-dd4fbcb3ec0e` from room URL)

---

## Steps to Test Once Agents Are Back Online

### Step 1 — Confirm all backend agents are running

In the Band room, you should see these agents listed as participants with green dots:
- Arbiter Orchestrator
- Triage
- Prosecuter
- Defender
- Judge
- UI Bridge (the bridge agent you registered)

### Step 2 — Start the bridge

```powershell
cd "C:\Users\Andrei Tomas\Desktop\Arbiter\bridge"
npm run dev
```

Expected output:
```
[bridge] HTTP + WS server listening on port 4000
[bridge]   REST  → http://localhost:4000
[bridge]   WS    → ws://localhost:4000/ws/case/:caseId
[bridge] Band agent connecting…
```

### Step 3 — Switch frontend to live mode

Open `Arbiter-Live/.env.local` and set:
```
VITE_DEMO_MODE=false
```
(The WS and API URLs already point to `localhost:4000`.)

Then start the frontend in a **separate terminal**:
```powershell
cd "C:\Users\Andrei Tomas\Desktop\Arbiter"
npm run dev
```

Open **http://localhost:5173/dashboard**

### Step 4 — Submit a test alert

Click **`+ NEW CASE`** in the top-right nav and paste one of the demo alerts:

```json
{
  "alert_id": "ALT-003",
  "source": "EDR",
  "rule_name": "LSASS_CREDENTIAL_DUMP",
  "timestamp": "2026-06-19T00:00:00Z",
  "asset_id": "ws-finance-04",
  "asset_criticality": "critical",
  "raw_payload": {
    "process": "rundll32.exe",
    "target_process": "lsass.exe",
    "access_rights": "0x1FFFFF",
    "user": "FINANCE\\svc-backup"
  }
}
```

Click **→ SUBMIT ALERT**.

### Step 5 — Watch the pipeline run

The dashboard should update in real time:
1. **Evidence panel** fills up as Triage posts `EVIDENCE_BUNDLE_READY`
2. **Debate feed** shows Prosecutor and Defender arguments
3. **Claim panel** builds up claim-by-claim
4. **Judge ruling** appears as full prose
5. **Approval modal** opens automatically if `requiresHumanApproval: true`

### Step 6 — Approve or reject

Read the full ruling in the modal, then click **✓ APPROVE** or **✗ REJECT**.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `THENVOI_ROOM_ID is not set` | Missing env var | Check `bridge/.env` has `THENVOI_ROOM_ID=...` |
| `Orchestrator agent not found in room` | Orchestrator offline or not in room | Wait for agents to come back online |
| Dashboard shows nothing after Submit | Bridge not connected to room | Check bridge console; confirm UI Bridge has green dot in Band room |
| Agent error banner appears | One of the backend agents threw an error | Check Band room for `[SYSTEM_DIAGNOSTICS]` messages |
| Demo mode still showing | `VITE_DEMO_MODE` still `true` | Set to `false` in `.env.local` and restart `npm run dev` |
| Verdict shows `CONF: UNKNOWN` | Judge used unusual confidence phrasing | See `INTEGRATION_NOTES.md` — this is expected and documented |

---

## Environment Variables Summary

### `bridge/.env`
```
THENVOI_AGENT_ID=03419cfe-...     ✅ set
THENVOI_API_KEY=band_a_...        ✅ set
THENVOI_ROOM_ID=3fdd48b8-...      ✅ set
PORT=4000
```

### `Arbiter-Live/.env.local`
```
VITE_DEMO_MODE=true               ← change to false for live mode
VITE_WS_URL=ws://localhost:4000/ws/case
VITE_API_URL=http://localhost:4000
```
