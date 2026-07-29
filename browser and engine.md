<!-- /autoplan restore point: C:\Users\Administrator\.gstack\projects\omini\PHASE_PLAN.md.restore-20260729-102513 -->
# OMINAI Phased Build Plan (autoplan-reviewed)

**Branch:** master | **Mode:** SELECTIVE EXPANSION | **Reviewed:** 2026-07-29 via `/autoplan`
**Repo:** `C:\Users\Administrator\omini` (Python adapter + agent prototype)
**Codex:** unavailable (not on PATH) — dual voices = Claude CEO + Claude Eng only `[subagent-only]`

---

## Three-Mode Architecture

OMINAI has three distinct operating modes, toggled from the VS Code title bar (Track A — separate repo):

| Mode | State | Backend | Description |
|------|-------|---------|-------------|
| **Coding** | Default | **Dormant** | Standard VS Code IDE. No AI agent activity whatsoever. No browser process, no BrowserManager, no agent loop. `OminaiBackendService` exists but nothing runs. |
| **OMINAI** | Current live mode | **Active** | AI agent workspace is active. `start_backend()` has been called. Browser sessions, BrowserManager, and Main Agent loop are live. `stop_backend()` returns to Coding. |
| **Agentic** | Coming soon (Track A v-next) | TBD | Deeper agentic runtime — planned but not yet specified. Will use the same `start_backend()` / `stop_backend()` lifecycle contract. No implementation in this repo until Track A defines it. |

### Mode-gating contract (backend requirements)

1. **`start_backend()`** is the single entry point Track A calls when OMINAI Mode switches ON. Nothing browser-related is created before it returns successfully — not at import time, not at process start.
2. **`stop_backend()`** is called when OMINAI Mode switches OFF or the host app closes. It must: close all browser-use sessions/pages, kill any spawned browser processes (no orphaned Chromium), cancel any in-flight Main Agent task, and flush the JSONL trace.
3. **While in Coding Mode** (backend stopped), any `IOminaiService` call must raise `OminaiModeOffError` immediately with a clear "OMINAI Mode is off" message. Never silently queue or hang.
4. **CLI smoke test** (`run_prototype.py`) has no real mode toggle: it calls `start_backend()` at the top and `stop_backend()` at exit, exercising the same lifecycle contract without a UI.
5. Every browser session and every agent loop must trace back to an explicit `start_backend()` call — never to something running just because the process is running.

---

## Vision

OMINAI is an IDE-native Control Center that orchestrates AI work with an audit trail. Browser adapters that drive ChatGPT/Claude/Gemini/Kimi **websites** are a **compatibility transport**, not the product spine. Official provider APIs are the durable path for keyed models; browser automation covers UI-only or login-bound cases.

### 10x Check
10x is not “we click four chat UIs.” 10x is: one workbench loop (plan → act → observe → verify) with retry/escalate rules, JSONL traces, and a pluggable transport (API | BROWSER) behind `ProviderAdapter` / `IOminaiService`.

### Platonic Ideal (12 months)
OMINAI Mode on → user prompt → task graph → Activity tab live → one transport executes → streamed answer attributed to provider → Stop cancels cleanly → no orphan browsers. Browser adapters optional and health-monitored.

---

## Premises (auto-accepted — user requested “complete all automatically”)

| # | Premise | Status | Kill criteria |
|---|---------|--------|---------------|
| P1 | Driving provider **websites** via DOM is acceptable for a prototype / compatibility layer | Accepted as **experimental**, not sole product | If ToS/CAPTCHA blocks >50% of smoke runs → API-only for that provider |
| P2 | CSS selectors will churn; adapters need ongoing maintenance | Accepted | Weekly `health_check` fail → mark DEGRADED |
| P3 | Persistent `user_data_dir` + manual first login is OK for v0 | Accepted for prototype | Product ship needs clearer auth UX |
| P4 | An OMINAI VS Code/Electron workbench exists **or will** — not necessarily in this repo | **Assumed with risk** | If missing after Phase 2 → ship CLI host + freeze IPC contract in-repo |
| P5 | Phase 1 browser-use and Phase 6 Playwright must **not** both be production | **Resolved by ADR-1** | — |
| P6 | Unit tests on interface ≠ live proof | Accepted | Phase 1 exit = one live ChatGPT smoke |

---

## ADR-1 — Single browser engine (CRITICAL — auto-decided)

**Decision:** Commit to **browser-use (`Browser` / actor `Page`)** through Phase 1–2 and the Python backend.
**Phase 6 Playwright UtilityProcess** is **deferred / spike-only**, not parallel production. Revisit only if Electron main-process isolation becomes a hard requirement *and* we migrate `BrowserManager` (adapters stay on `ProviderAdapter`).

**Rejected:** Dual stacks (rewrite tax). **Rejected for now:** Rewrite Phase 1 on Playwright immediately (throws away working façade).

**Principle:** P5 explicit + P3 pragmatic.

---

## ADR-2 — Phase reorder (auto-decided)

**Was:** 1 → 2 → 3 UI → 4 service → 5 wire → 6 engine
**Now:** 1 → 2 → **4 contract+mock** → **3 UI against mock** → 5 wire → 6 deferred

**Principle:** P1 completeness of integration seam before UI hardcodes shapes.

---

## ADR-3 — Transport split (auto-decided, taste surfaced at gate)

Introduce `Transport = BROWSER | API` in Phase 2 design (not Phase 6 surprise).
Phase 2 Main Agent talks only to `ProviderAdapter` / tool schema. API adapters can land after one browser provider works.

---

## What already exists

| Sub-problem | Existing code |
|-------------|---------------|
| Provider interface | `browser_adapter/base.py` — `ProviderAdapter`, `AdapterResult` |
| browser-use isolation | `browser_adapter/browser_manager.py` (sole `browser_use` import) |
| Registry | `browser_adapter/registry.py` — chatgpt/claude/gemini/kimi |
| Site templates | `adapters/_base_site.py` + four provider stubs (placeholder selectors) |
| CLI smoke entry | `run_prototype.py` |
| Interface tests | `tests/test_browser_adapter.py` (7 passed) |
| API notes | `browser_adapter/API_NOTES.md` |
| Vendor reference | `vendor/browser-use` |

---

## NOT in scope (this plan)

- Multi-provider debate/voting
- MCP tool protocol (leave seam only)
- Production CAPTCHA/stealth farm
- Rewriting on Playwright UtilityProcess as default
- Fine-tuning / “AI training” of weights (Main Agent = prompt + tools + SM only)
- Shipping four fully tuned live selectors without DevTools validation

Deferred → `TODOS.md`.

---

## Dream state delta

```
CURRENT          THIS PLAN                    12-MONTH IDEAL
-------          ---------                    --------------
Python scaffold  Hardened adapter + agent     Workbench Mode
+ placeholder    + IOminaiService contract    + API+BROWSER transports
  selectors      + mock UI loop              + health/DEGRADED
+ no agent       + 1 live provider smoke      + UtilityProcess only
+ no workbench   + Playwright deferred          if ADR revisited
```

---

## Implementation alternatives (0C-bis) — decided

| Approach | Effort | Risk | Verdict |
|----------|--------|------|---------|
| A. browser-use through P1–2, defer Playwright | Low | Medium (Electron isolation later) | **SELECTED** |
| B. Rewrite P1 on Playwright now | High | Medium | Deferred |
| C. API-only, drop browser | Medium | Low tech / loses UI-only providers | Partial — API as second transport later |
| D. Dual stacks in parallel | Very high | Critical | **REJECTED** |

---

## Phased execution (revised)

### Phase 0 — browser-use API verification ✅ DONE
Exit: real method names documented; `BrowserManager` matches `start` / `new_page` / `kill`.

### Phase 1 — Browser Adapter prototype 🔄 HARDEN then close
**Exit criteria:**
1. One live ChatGPT headed smoke via `run_prototype.py` extracts non-empty response
2. `AdapterResult.error_code` added (`LOGIN_REQUIRED`, `SELECTOR_STALE`, `TIMEOUT`, `EMPTY_RESPONSE`, `CRASH`, …)
3. Ban settle-as-success without non-empty extract
4. Per-provider `user_data_dir` under `./omini_profile/<provider>/`
5. Fake-page unit tests for ready/send/complete/extract failure paths
6. AST/CI: only `browser_manager.py` imports `browser_use`
7. Selectors externalizable (YAML/JSON) — ChatGPT filled; others stubs OK

**Non-goals:** Perfect Claude/Gemini/Kimi selectors.

### Phase 2 — Main Agent orchestration
**Build:**
- `agent/prompts/system.md` (config file, not hardcoded)
- State machine: `PLAN → SELECT_PROVIDER → SEND → OBSERVE → VERIFY → DONE | RETRY | ESCALATE`
- Tool dispatch: JSON `{"action","provider","args"}` → `ProviderAdapter` methods
- Loop safety: max retries, max actions, per-task timeout
- JSONL trace (`traces/agent-*.jsonl`) + screenshot on escalate
- Map `error_code` → RETRY vs ESCALATE

**Exit:** Hardcoded or LLM-planned single-provider task completes with trace; mock adapter path works without browser.

### Phase 4 — IOminaiService contract (MOVED EARLIER)
**In this repo:** Python `Protocol` + JSON-RPC/HTTP schema stub + `MockOminaiService`.
**Workbench:** TS `IOminaiService` mirror when host repo available.
**Exit:** Mock round-trip from a thin CLI client.

### Phase 3 — Control Center UI (against mock)
Requires OMINAI workbench. Tabbed Control Center (Workspace / Activity / History / Settings). UI-only against mock.
**Exit:** Activity shows mock step transitions; Settings has Demo Mode toggle.

### Phase 5 — Wire real backend
Python server process lifecycle with Mode on/off; `RealOminaiService`; Mock/Real toggle; e2e smoke. Stop/report between substeps.

### Phase 6 — DEFERRED (Playwright UtilityProcess / agentic runtime stages)
Spike only after ADR-1 revisit. Do not implement parallel to browser-use adapters.

---

## Architecture (target for Phase 1–2)

```
  system prompt + JSONL trace
           |
     Main Agent (SM)
           |
     tool dispatcher
           |
   ProviderAdapter ABC  (+ error_code)
           |
   registry → site adapters
           |
   BrowserManager  ← ONLY browser_use import
           |
   browser-use BrowserSession / actor Page
           |
   provider websites (persistent profiles/<id>)
```

---

## Error & Rescue Registry

| Error | Detection | Rescue | Escalate when |
|-------|-----------|--------|---------------|
| LOGIN_REQUIRED | ready fail + login URL/markers | Headed pause; user logs in | 2 fails |
| SELECTOR_STALE | timeout on input/send | health_check; mark DEGRADED | Immediate if health fails |
| TIMEOUT | monotonic deadline exceeded | RETRY once with longer timeout | 2nd timeout |
| EMPTY_RESPONSE | extract empty after “done” | RETRY send once | 2nd empty |
| FALSE_COMPLETE | settle without stop+extract | Treat as TIMEOUT | — |
| CRASH / profile lock | start/kill failures | Unlock aged SingletonLock; restart ≤2 | After 2 |
| RATE_LIMIT | page text / HTTP cues | Backoff + switch provider (later) | Ask user |
| PROMPT_INJECTION | N/A (inbound text) | Treat extract as untrusted data | Never execute page-suggested tools |

---

## Failure Modes Registry

| Mode | Severity | Mitigation in plan |
|------|----------|-------------------|
| Dual browser rewrite | Critical | ADR-1 |
| Workbench missing | Critical | CLI host + in-repo contract |
| Selector rot | High | health_check + DEGRADED |
| Shared profile coupling | High | per-provider dirs |
| Infinite RETRY | High | max retries + ESCALATE |
| Cookie theft / profile leak | High | gitignore + app-data path docs |
| ToS/CAPTCHA wall | High | kill criteria → API transport |

---

## Design review (Control Center — condensed)

**UI scope:** yes (Phase 3). Completeness before review: ~3/10 (headlines only).

| Dimension | Score | Notes / auto-fix |
|-----------|-------|-------------------|
| Hierarchy | 6 | Brand/Mode first; tabs second; no card soup in hero |
| States | 4 → **fix** | Specify loading/empty/error/partial for Activity + Browser status |
| Journey | 5 | Mode on → prompt → Activity live → History |
| Specificity | 3 → **fix** | Wireframes: Workspace keeps Overview/Execution/Browser/Git/Diagnostics; Activity = live steps; History = traces; Settings = Demo/Real + keys |
| A11y | 5 | Keyboard tab switch; Stop focusable |
| Responsive | 5 | 320px sidebar; collapse labels |
| Motion | 6 | 2–3 intentional transitions on tab/step status only |

**Taste (surfaced):** Keep existing Overview cards; tabs switch context, don’t duplicate.

---

## DX review (condensed)

Product type: library + CLI + (later) IDE service.
**TTHW target:** <5 min — clone/venv → `pip install` → `python run_prototype.py` → login once → see RESPONSE.

| Dimension | Score | Fix in plan |
|-----------|-------|-------------|
| Getting started | 5 | README with exact commands |
| Naming | 7 | `provider_id` / `AdapterResult` clear |
| Errors | 4 → **fix** | `error_code` + human message + next step |
| Docs | 3 → **fix** | README + API_NOTES |
| Upgrade | 6 | pin browser-use; note actor≠Playwright |
| Escape hatches | 6 | `--provider`, headed default |
| Dev env | 5 | `.venv` documented |
| Observability | 4 → **fix** | JSONL traces path in README |

---

## Test plan

Artifact: `~/.gstack/projects/omini/master-omini-test-plan-20260729.md`

### Phase 1–2 test diagram
| Codepath | Unit | Live |
|----------|------|------|
| registry / ABC | ✅ exists | — |
| wait_until_ready fail | **add** fake page | — |
| settle without extract → TIMEOUT | **add** | — |
| extract empty | **add** | — |
| error_code → RETRY/ESCALATE | **add** SM table | — |
| max retries | **add** | — |
| only browser_manager imports browser_use | **add** AST | — |
| ChatGPT happy path | — | **manual/live mark** |
| profile lock restart | **add** | optional |

---

## Temporal interrogation

| Horizon | Focus |
|---------|-------|
| Hour 1 | Live ChatGPT smoke + error_code |
| Hour 6 | Main Agent + mock adapter + JSONL |
| Day 2 | Contract Phase 4 + README TTHW |
| Week 2 | UI against mock if workbench exists |
| Month 1 | Real wire; health monitors |
| Month 6 | API transport primary; browser DEGRADED ok |

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Mode = SELECTIVE EXPANSION | Mechanical | P6 | Feature iteration on greenfield plan | HOLD/EXPAND extremes |
| 2 | CEO | Premises P1–P6 accepted with kill criteria | User-auto (requested full auto) | P6 | User: complete all automatically | Interactive premise gate |
| 3 | CEO/Eng | ADR-1 browser-use only; defer Playwright | Taste → recommended | P5/P3 | Avoid dual stack rewrite | Dual / Playwright-now |
| 4 | CEO/Eng | ADR-2 reorder 4 before 3 | Taste → recommended | P1 | Contract before UI | UI before service |
| 5 | CEO | Browser = compatibility; API later | Taste → recommended | P1 | Durable product framing | Browser-as-spine |
| 6 | Eng | Add error_code to AdapterResult | Mechanical | P1 | Enables RETRY/ESCALATE | String-only errors |
| 7 | Eng | Ban settle-as-success | Mechanical | P1 | Stops false DONE | Soft sleep success |
| 8 | Eng | Per-provider profiles | Mechanical | P2 | Isolation | Shared profile |
| 9 | Design | Tabs integrate existing cards | Mechanical | P5 | Prompt 4 intent | Rebuild dashboard |
| 10 | DX | README + TTHW <5m | Mechanical | P5 | DX completeness | Docs later |
| 11 | Voices | Codex skip | Mechanical | — | Binary missing | Block pipeline |

---

## Cross-phase themes

**Theme: Dual browser stacks** — CEO F1 + Eng P0. High-confidence. Resolved by ADR-1.
**Theme: Contract before UI** — CEO F10 + Eng P0 reorder. Resolved by ADR-2.
**Theme: False completion / brittle DOM** — Eng P0 + CEO F9. Fixed in Phase 1 harden list.

---

## CEO DUAL VOICES — CONSENSUS TABLE
```
  Dimension                            Claude  Codex  Consensus
  1. Premises valid?                   WARN    N/A    WARN (kill criteria added)
  2. Right problem to solve?           PARTIAL N/A    PARTIAL → reframed
  3. Scope calibration correct?        NO→FIX  N/A    ADR-1/2 applied
  4. Alternatives explored?            WEAK→OK N/A    0C-bis table added
  5. Competitive risks covered?        YES     N/A    YES
  6. 6-month trajectory sound?         NO→FIX  N/A    mock UI + single engine
```
Source: `[subagent-only]`

## ENG DUAL VOICES — CONSENSUS TABLE
```
  Dimension                            Claude  Codex  Consensus
  1. Architecture sound?               COND.   N/A    COND. with ADR-1
  2. Test coverage sufficient?         NO      N/A    NO → test plan
  3. Performance risks addressed?      OK      N/A    OK (not primary)
  4. Security threats covered?         WARN    N/A    WARN → profile/keys
  5. Error paths handled?              NO→FIX  N/A    error_code + registry
  6. Deployment risk manageable?       OK      N/A    OK for prototype
```

## DESIGN / DX
Design litmus: states+specificity incomplete → fixes listed.
DX consensus: TTHW and errors need README + error_code (auto-included).

---

## Scope decisions (cherry-picked expansions)

| Expansion | Decision | Effort |
|-----------|----------|--------|
| error_code on AdapterResult | Include | CC ~20m |
| Per-provider profiles | Include | CC ~15m |
| Fake-page unit tests | Include | CC ~30m |
| Selector YAML | Include | CC ~25m |
| API Transport stub in Phase 2 | Include (interface only) | CC ~20m |
| Temporary CLI host if no workbench | Include | CC ~45m |
| Playwright UtilityProcess now | **Defer** | — |
| Multi-provider voting | **Cut** | — |
| MCP | **Defer** | — |

---

## Implementation Tasks (aggregated)

- [ ] **T1 (P1, human: ~2h / CC: ~20m) — AdapterResult.error_code** — Surfaced by: eng-review — Files: `base.py`, `_base_site.py`, tests
- [ ] **T2 (P1, human: ~3h / CC: ~30m) — Ban false completion + monotonic deadlines** — eng-review — `_base_site.py`, `browser_manager.py`
- [ ] **T3 (P1, human: ~1h / CC: ~15m) — Per-provider user_data_dir** — eng-review — `run_prototype.py`, `BrowserManager`
- [ ] **T4 (P1, human: ~2h / CC: ~30m) — Fake page unit tests** — eng-review — `tests/`
- [ ] **T5 (P1, human: ~1h / CC: ~15m) — Live ChatGPT smoke (manual)** — ceo/eng — `run_prototype.py`
- [ ] **T6 (P1, human: ~4h / CC: ~1h) — Main Agent SM + JSONL + tool dispatch** — plan Phase 2 — new `agent/`
- [ ] **T7 (P1, human: ~2h / CC: ~25m) — IOminaiService Protocol + Mock** — Phase 4 — new `service/`
- [ ] **T8 (P2, human: ~1h / CC: ~20m) — README TTHW** — dx-review — `README.md`
- [ ] **T9 (P2, human: depends on host) — Control Center UI against mock** — Phase 3 — workbench repo
- [ ] **T10 (P3, deferred) — Playwright UtilityProcess** — ADR-1 revisit only

---

## GSTACK REVIEW REPORT

```
/autoplan review
================
CEO:    issues_open (ADR applied; premises auto-accepted per user)
Design: issues_open (states/specificity fixes listed; UI later)
Eng:    issues_open (harden Phase 1 required before Phase 2)
DX:     issues_open (README missing)
Voices: subagent-only (codex unavailable)
        CEO consensus: partial; Eng consensus: conditional
Status: AWAITING FINAL APPROVAL
```
