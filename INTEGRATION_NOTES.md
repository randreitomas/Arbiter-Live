# Arbiter Integration Notes

This document lists every place where backend output had to be approximated
or parsed heuristically rather than read as authoritative ground truth. A
future contributor should read this before modifying any parser.

---

## What is ground truth

| Data point | Source | Status |
|---|---|---|
| `evidence_id` | Triage JSON (`EVIDENCE_BUNDLE_READY`) | **Authoritative** |
| `fact` | Triage JSON | **Authoritative** |
| `source_type` | Triage JSON | **Authoritative** |
| `confidence` (0–1) | Triage JSON | **Authoritative** |
| `raw_ref` | Triage JSON | **Authoritative** |
| Verdict decision | Judge prose — JUDGE_DICTIONARY exact substring | **Authoritative** (fixed strings, deterministic) |
| `requiresHumanApproval` | Judge prose — keyword search | **High confidence** (Judge is instructed to always state this explicitly) |
| Prosecutor position | `Position: REAL INCIDENT` line | **Authoritative** |
| Defender position | `Position: BENIGN` line | **Authoritative** |
| Concede | `Position: CONCEDE` line | **Authoritative** — which side conceded is derived from state |
| EVD-* citations in prose | Regex `EVD-[0-9a-f]{6}-\d{3}` | **Authoritative** (Judge prompt explicitly instructs inline citation) |
| MITRE T-IDs in prose | Regex `T\d{4}(\.\d{3})?` | **High confidence** |

---

## Approximations

### 1. Verdict severity

**What happens:** `bridge/src/parsers/judge.ts` `extractSeverity()` searches the
Judge prose for the words "low / medium / high / critical" near "severity".

**Why it's approximate:** The Judge is instructed to state severity explicitly
("State the severity you assigned (low / medium / high / critical)") but the exact
phrasing varies. The regex `severity[^.]{0,40}?\b(critical|high|medium|low)\b` and
its fallback may occasionally mis-extract the first severity-adjacent word in the
prose.

**Risk:** Low — the words "critical / high / medium / low" are strongly associated
with severity in the Judge's prompt, and the severity section appears in paragraph 3
where confidence language also appears. False positives are possible but uncommon.

**Mitigation:** In Phase 2 (running the backend), capture real Judge output for all
three demo alerts and verify the regex extracts the correct values. Update the
regex in `judge.ts` if needed.

**UI treatment:** `Verdict.severity` is typed as `VerdictSeverity | null`. The UI
renders a null severity gracefully (omits the SEV badge).

---

### 2. Verdict confidence

**What happens:** `extractConfidence()` searches for phrases like
"I hold this with high confidence" / "with medium confidence".

**Why it's approximate:** The Judge is asked to state confidence "in plain words"
but there is no guaranteed phrasing. The regex
`with\s+(very\s+high|high|medium|low)\s+confidence` covers the example given in
the prompt; any unusual phrasing will fall through to `'unknown'`.

**Risk:** Moderate — real Judge output may use different phrasings. The fallback
`'unknown'` is visible in the UI so reviewers know confidence wasn't found.

**Mitigation:** Capture real output in Phase 2 and extend the regex.

**UI treatment:** `VerdictConfidence` is `'low' | 'medium' | 'high' | 'very_high' | 'unknown'`.
The UI renders these verbatim, never as a fabricated percentage.

---

### 3. Implied actions

**What happens:** `extractImpliedActions()` finds sentences containing
action-language keywords (isolate, disable, block, quarantine, revoke, reset,
contain, suspend, remove).

**Why it's approximate:** The Judge is instructed to "name the implied action in
reasoning" as prose — there is no structured `recommendedActions` field anywhere in
the backend. The extraction is keyword-based and will miss actions phrased unusually
(e.g. "the host should be taken offline").

**Risk:** High — the free-text approach is inherently lossy. Some implied actions
may be missed; some sentences with these words may not describe actions (e.g.
"the defender failed to remove doubt").

**UI treatment:** Shown in the `ApprovalModal` clearly labeled as
"IMPLIED ACTIONS (parsed from ruling — best-effort)". If `impliedActions` is null,
the modal explicitly states "No structured action list available". Either way the
human reviewer still sees the full ruling prose and must give an explicit
approve/reject decision — the approval gate is never bypassed.

---

### 4. Struck claims

**What happens:** `bridge/src/parsers/judge.ts` does NOT proactively parse struck
claims from Judge prose into the `Claim.status = 'struck'` field. Struck claims are
only set on the demo data (hardcoded), not on live data.

**Why:** The Judge prompt says to "say so in a sentence" when any arguments were
struck, but this is a single prose sentence, not a structured list. Reliable
extraction would require knowing every EVD-* ID cited by each Prosecutor/Defender
message and checking whether the Judge prose explicitly names each as struck —
possible in principle but fragile against paraphrasing.

**Current behavior (live mode):** All surviving claims default to `status: 'valid'`.
Claims are marked `status: 'concede'` only when the agent's own `Position: CONCEDE`
line is present (that is fully reliable). Struck status is never set from live Judge
prose in this implementation.

**Future work:** With Phase 2 captured output, a more targeted regex could be
added, e.g. matching "claim … struck" / "argument … cannot stand" near an EVD-* ID.

---

### 5. Prosecution CONCEDE disambiguation

**What happens:** When the bridge sees `Position: CONCEDE` and the active case has
`prosecutionPosted=true` but `defensePosted=false`, it classifies the message as
`prosecution`. Otherwise it classifies as `defense`.

**Risk:** If defense posts before prosecution (non-standard ordering), or if both
have posted and prosecution concedes in a second round, the classification could be
wrong.

**Mitigation:** Using sender handle (from `tools.getParticipants()`) would be
more reliable. The current content-only approach is chosen for simplicity. The
classification error would only affect which `agent` field is populated on the
`Claim` — the prose text and evidence citations are still correctly extracted.

---

## What was intentionally omitted

- **`RecommendedAction` checklist** — removed entirely. The backend has no
  structured action list; inventing one would misrepresent the Judge's output.
- **`reasoning: string[]` (bullet list)** — removed. The Judge writes prose
  paragraphs, not bullet points. Splitting on sentence boundaries would fabricate
  structure. The full prose is stored in `reasoning: string` and displayed verbatim.
- **Numeric confidence percentage** — removed (was `"94%"` in demo data).
  The Judge never outputs a number. Replaced with qualitative `VerdictConfidence` band.
- **`rebuttal` message type** — removed. No reliable signal distinguishes a rebuttal
  from a second argument in real Prosecutor/Defender output.

---

## Running Phase 2 (contract verification)

Before deploying to production, run the full backend and bridge against the three
demo alerts in `backend/demo/*.json`:

```bash
# In the backend repo
python3 run_all.py

# In the bridge folder
npm run dev

# Post each demo alert:
curl -X POST http://localhost:4000/case \
  -H 'Content-Type: application/json' \
  -d @../backend/demo/lsass_dump.json
```

Capture the raw Prosecutor, Defender, and Judge messages from the Band room
(visible in the bridge's console log), then verify:
1. `extractSeverity` returns the correct band.
2. `extractConfidence` returns the correct band (or 'unknown' if phrasing is novel).
3. `extractImpliedActions` captures the right sentences.
4. Update regexes in `bridge/src/parsers/judge.ts` as needed.
