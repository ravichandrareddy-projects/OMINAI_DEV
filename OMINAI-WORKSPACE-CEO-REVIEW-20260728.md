# OMINAI Workspace — CEO Review Report

**Generated:** 2026-07-28
**Branch:** omini-main
**Repo:** ravichandrareddy-projects/OMINAI_DEV
**Mode:** HOLD SCOPE (Maximum Rigor)
**Review scope:** 26 source files across chat components, control center, settings, and mock services

---

## GSTACK REVIEW REPORT

### Sections Overview

| # | Section | Status | Findings | Verdict |
|---|---|---|---|---|
| 1 | Architecture Review | COMPLETE | 5 (1A–1E) | FOUNDATION: Dependencies wrong (1A, 1D), duplicate surfaces (1B), stale events (1C, 1E). Fix subscription patterns first. |
| 2 | Error & Rescue Map | COMPLETE | 4 (2A–2D) | AT RISK: Global error isolation is missing — uncaught exceptions in any handler kill the overlay. |
| 3 | Security & Threat Model | COMPLETE | 1 (3A) | WARN: API key UX destroys data on edit. Needs review of real credential storage. |
| 4 | Data Flow & Interaction Edge Cases | COMPLETE | 2 (4A–4B) | WARN: No input rate-limiting. Singleton leak possible on re-open. |
| 5 | Code Quality Review | COMPLETE | 2 (5A–5B) | PASS (with notes): CSS prefixes inconsistent. Dead emitter unused. |
| 6 | Test Review | COMPLETE | 1 (6A) | FAIL: Zero tests. Components lack factory patterns for injection. |
| 7 | Performance Review | COMPLETE | 1 (7A) | PASS: No blocking perf issues at current scale. DOM rebuild patterns noted. |
| 8 | Observability & Debuggability | COMPLETE | 1 (8A) | FAIL: Mock execution service never fires state changes. Production observability nonexistent. |
| 9 | Deployment & Rollout Review | COMPLETE | 1 (9A) | AT RISK: No feature flag, no experiment framework, no gating. |
| 10 | Long-Term Trajectory Review | COMPLETE | 4 (10A–10D) | WARN: Tight coupling prevents modular extraction. CSS won't scale. Monolith DI construction. |
| 11 | Design & UX Review | COMPLETE | 2 (11A–11B) | PASS (with notes): Missing loading states and screen reader support. |
| — | Outside Voice (Claude subagent) | COMPLETE | 8 (OV1–OV8) | STRATEGIC: Provider model has no inference interface. 2 dead components. Layering violation. Settings persistence is theater. |

**Overall Verdict:** FOUNDATION + STRATEGIC CORRECTION NEEDED. The scaffold is structurally sound but has bleeding-edge gaps (error isolation, test coverage, feature flagging) that must be resolved before adding real LLM integration. The outside voice identified strategic dead code and a provider abstraction designed too early — building the control plane before the data plane. Fix the foundation, cut the dead weight, then integrate real services.

---

## Completion Summary

### Section 1: Architecture Review

**Finding 1A — Tab components use `new` instead of DI (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts:51-62`
- **Issue:** `new WorkspaceTab(workspacePane)`, `new ActivityTab(activityPane)`, `new HistoryTab(historyPane)` bypass the instantiation service.
- **Fix:** Switch to `this.instantiationService.createInstance(WorkspaceTab, ...)`. Add `@IInstantiationService` to each tab constructor (already present for some).
- **Existing pattern:** `WelcomeScreen` and `ConversationView` use `createInstance`.

**Finding 1B — ProjectWorkspacePanel duplicates WorkspaceTab (new from Outside Voice)**
- **File:** `projectWorkspacePanel.ts`, `workspaceTab.ts`
- **Issue:** 218-line `ProjectWorkspacePanel` (never instantiated) and 207-line `WorkspaceTab` have near-identical section builders (overview, execution, browser, git, diagnostics).
- **Fix:** Remove `ProjectWorkspacePanel` (dead code). Extract shared render helpers into a common module used by `WorkspaceTab`.

**Finding 1C — setTimeout leak in prompt handler (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts:112-118`
- **Issue:** Raw `setTimeout` with no try/catch. If overlay disposes during 500ms window, callback fires against destroyed view.
- **Fix:** Wrap in `Disposable` timeout. Use `addDisposableTimeout` or store the handle in `MutableDisposable` for cleanup on dispose.

**Finding 1D — SettingsTab overlaps with OminaiSettingsWindow (ACCEPTED)**
- **File:** `controlCenter/settingsTab.ts`, `settingsWindow/ominaiSettingsWindow.ts`
- **Issue:** `SettingsTab._build*` methods (5 inline builders) overlap with settings window on 5 categories. Two sources of truth for settings UI.
- **Fix:** Remove `SettingsTab` (the full window and QuickSettings cover its use cases). Complete the QuickSettings → full window handoff.

**Finding 1E — ConversationView has no virtualization + loading state + ARIA (ACCEPTED)**
- **File:** `components/conversationView.ts`
- **Issue:** Flat message feed with no loading state, no `role="log"`, no `aria-live="polite"`.
- **Fix:** Add loading indicator, `role="log"` with `aria-live="polite"`, and prepare for virtualization at scale.

### Section 2: Error & Rescue Map

**Finding 2A — Permissions mode stored as boolean, read as string (ACCEPTED)**
- **File:** `settingsWindow/ominaiSettingsWindow.ts`
- **Issue:** `setBoolean('permissions.mode', mode.id === 'full')` stores a boolean; `getString('permissions.mode', 'full')` reads a string. Masked by fallback default.
- **Fix:** Use consistent storage (e.g., `setString('permissions.mode', mode.id)` with `getString('permissions.mode', 'none')`).

**Finding 2B — `_onPromptSubmitted` has no try/catch (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts:100-118`
- **Issue:** Any exception in the handler chain (welcomeScreen.hide → conversationView.show → addMessage → setTimeout) kills the overlay.
- **Fix:** Wrap body in `try/catch` with `this.logger.error()` fallback. Add variant that still shows error in conversation view.

**Finding 2C — `mount()` has DOM duplicate risk (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts:121-134`
- **Issue:** No guard against calling `mount()` twice — would append duplicate child.
- **Fix:** Guard with `if (this.container.parentElement) return;`.

**Finding 2D — `_openSettingsWindow` has no try/catch (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts:83-86`
- **Issue:** No error isolation on settings window instantiation or singleton guard.
- **Fix:** Add try/catch and check for existing settings window before creating a new instance.

### Section 3: Security & Threat Model

**Finding 3A — API key edit clears value before saving (ACCEPTED)**
- **File:** `settingsWindow/ominaiSettingsWindow.ts`
- **Issue:** Editing an API key creates the input, reads it, then re-inputs — the value is cleared in the process.
- **Fix:** On edit, pre-populate the input with the existing masked value (e.g., `••••{last4}`). Show a "Reveal" toggle. Never expose full keys in memory longer than needed.

### Section 4: Data Flow & Interaction Edge Cases

**Finding 4A — No debounce/throttle on prompt submission (ACCEPTED)**
- **File:** `components/promptInput.ts`
- **Issue:** Rapid prompt submission (enter key spam) creates multiple concurrent mock responses.
- **Fix:** Add debounce (300ms) or disable send button during active response. Queue subsequent submissions.

**Finding 4B — `_openSettingsWindow` has no singleton guard (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts:83-86`
- **Issue:** Rapid `_onDidClickSettings` events open multiple settings windows. No guard against leaks.
- **Fix:** Track instance via `MutableDisposable` — dispose previous before creating new. Or use boolean guard.

### Section 5: Code Quality Review

**Finding 5A — CSS prefix inconsistency: `omini-`, `omin-`, `ominai-` (ACCEPTED)**
- **File:** `media/ominai.css` (2606 lines)
- **Issue:** Three naming conventions coexist: `.omini-exec-*` (workspaceTab.ts), `.omin-activity-*` (CSS lines 1056-1059), `.ominai-*` (everywhere else).
- **Fix:** Normalize to `.ominai-*` prefix. Add CSS lint rule. Migrate in one pass.

**Finding 5B — `_onDidSubmitFirstPrompt` dead emitter (ACCEPTED)**
- **File:** `components/promptInput.ts`
- **Issue:** Emitter defined but never fired. Likely leftover from earlier design.
- **Fix:** Remove dead emitter and its associated event property.

### Section 6: Test Review

**Finding 6A — Zero tests across all 26 files (ACCEPTED)**
- **Files:** All under `src/vs/ominai/`
- **Issue:** No unit tests for any component. Existing workbench test patterns (`src/vs/workbench/test`) not followed.
- **Fix:** Add tests following workbench patterns. Priority: core state (MockOminaiExecutionService, MockOminaiSessionService), then rendering (WelcomeScreen, PromptInput, ConversationView), then integration.

### Section 7: Performance Review

**Finding 7A — DOM-rebuild update pattern in control center tabs (new from Outside Voice)**
- **Files:** `workspaceTab.ts`, `activityTab.ts`, `historyTab.ts`
- **Issue:** `update()` does `this.body.textContent = ''` then full DOM reconstruction. Kills child listeners, loses focus, regenerates whole subtree.
- **Fix:** Use targeted DOM updates (class toggles, innerText changes on specific elements) instead of full rebuild. Consider constructing a new tab instance when full refresh is needed.

### Section 8: Observability & Debuggability

**Finding 8A — MockOminaiExecutionService never fires onDidChangeExecutionState (ACCEPTED)**
- **File:** `ominaiMockServices.ts`
- **Issue:** The mock execution service creates an emitter and defines the event, but never fires it. Any subscriber waits forever.
- **Fix:** Add discretionary state transitions in mock. Add `fireTick()` helper for test/debug use. Add trace logging to all mock service methods.

### Section 9: Deployment & Rollout Review

**Finding 9A — No feature flag or experiment gate for the overlay (ACCEPTED)**
- **File:** `ominaiWorkspace.contribution.ts`
- **Issue:** Overlay compiles unconditionally into the workbench. No registry toggle, no experiment, no `IProductService` check.
- **Fix:** Add feature flag via `IWorkbenchContributionsRegistry` (register only when enabled). Use `IProductService` or experiment service for gating.

### Section 10: Long-Term Trajectory Review

**Finding 10A — Monolithic DI construction (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts:31-77`
- **Issue:** Constructor creates all 9 child components inline, mounting everything at once. No lazy loading, no deferred init.
- **Fix:** Extract component initialization into named phases (initUI, initListeners, initServices). Consider lazy init for non-critical components (history, activity).

**Finding 10B — Tight coupling prevents modular extraction (ACCEPTED)**
- **File:** `ominaiWorkspaceOverlay.ts`
- **Issue:** Overlay is tightly coupled to editor part mounting, layout service, and all 6 service interfaces. Extracting the chat surface or control center requires the full dependency set.
- **Fix:** Use interface segregation — define focused interfaces for each sub-surface (IChatSurface, IControlCenter). Allow each to be independently mountable.

**Finding 10C — CSS won't scale with feature growth (ACCEPTED)**
- **File:** `media/ominai.css` (2606 lines)
- **Issue:** Single flat CSS file with no component scoping. As features grow, specificity conflicts and cascade issues escalate.
- **Fix:** Organize CSS by component with clear section headers. Use consistent CSS custom properties tier. Consider CSS modules or shadow DOM scoping at scale.

**Finding 10D — Settings persistence gap becomes showstopper at launch (new from Outside Voice)**
- **Files:** `settingsWindow/ominaiSettingsWindow.ts`
- **Issue:** 580 lines of settings UI backed by in-memory `SettingsStore` that "reset[s] on close." API keys, mode selections, toggle states disappear on window close.
- **Fix:** Connect settings to VS Code's `IStorageService` (workspace-scoped for most settings, secret storage for API keys). Ship with at least one working save-path before launch.

### Section 11: Design & UX Review

**Finding 11A — No loading state for assistant responses (ACCEPTED)**
- **File:** `components/conversationView.ts` + `components/chatMessage.ts`
- **Issue:** When user submits a prompt, no intermediate loading state appears until the 500ms setTimeout fires.
- **Fix:** Show an "OMINAI is thinking..." skeleton/hint immediately on submission. Replace with full response when it arrives.

**Finding 11B — No screen reader announcements (ACCEPTED)**
- **File:** `components/conversationView.ts` + `controlCenter/tabNavigation.ts`
- **Issue:** New messages appear silently. Tab switches announce nothing. Welcome screen cards lack `aria-current`.
- **Fix:** Add `role="log"` and `aria-live="polite"` to conversation feed. Add `role="tablist"`/`role="tab"`/`aria-selected` to tab navigation. Announce new messages via `aria-live` region.

### Outside Voice: Strategic Findings

**Finding OV1 — Provider model has no inference interface (ACCEPTED)**
- **File:** `common/ominaiServices.ts`, `ominaiMockServices.ts`
- **Issue:** `IOminaiProviderService` has 33 providers, 10 tiers, 14 roles, assignment UI, search, pickers — but zero methods to send a prompt or get a completion. No `complete()`, `stream()`, or `cancel()`.
- **Fix:** Add inference interface to `IOminaiProviderService` before building provider assignment UI. Build the data plane before the control plane.

**Finding OV2 — All 6 service contracts describe data snapshots, not behavior (ACCEPTED)**
- **Files:** `common/ominaiServices.ts`, `ominaiMockServices.ts`
- **Issue:** Every service interface describes what data looks like, not what the system does. `IOminaiSessionService` has no messages. `IOminaiExecutionService` has no `start()`, `stop()`, `observe()`. `IOminaiBrowserService` is empty.
- **Fix:** Audit each service contract. Add behavioral methods before real integration. Add `message` storage to session service. Add execution lifecycle to execution service. Remove or implement browser service.

**Finding OV3 — Layering violation: `vs/ominai` imports from `vs/sessions` (ACCEPTED)**
- **File:** `ominaiWorkspace.contribution.ts`
- **Issue:** Imports `OMINI_MODE_CONTEXT_KEY`, `OMINIMode`, and `onDidChangeOMINIMode` from `../../sessions/contrib/omini/browser/ominiModeSwitcher.js`. Per architecture docs, `vs/sessions` "may import from workbench but not vice versa."
- **Fix:** Extract the shared mode constants into `vs/platform/` or `vs/base/` so both `vs/sessions` and `vs/ominai` can import without circular dependency risk. Or use a dedicated `vs/ominai/common/ominiMode.ts` with the mode context key.

**Finding OV4 — QuickSettings is architecturally dead code (ACCEPTED)**
- **File:** `controlCenter/quickSettings.ts`, `controlCenter/settingsTab.ts`
- **Issue:** The settings tab click fires `_onDidClickSettings` which opens the full settings window. QuickSettings exists in the DOM but is permanently `display: none` because no tab ever activates it.
- **Fix:** Either delete QuickSettings (if full window covers all use cases) or make the settings tab show QuickSettings inline instead of opening the full window.

**Finding OV5 — ProjectWorkspacePanel is dead code (ACCEPTED)**
- **File:** `components/projectWorkspacePanel.ts`
- **Issue:** 218 lines with 3 injected services — never instantiated by OminaiWorkspaceOverlay.
- **Fix:** Remove `ProjectWorkspacePanel`. (Duplicates `WorkspaceTab` section layout.)

**Finding OV6 — Right panel (ControlCenter) strategic scope creep (ACCEPTED)**
- **File:** `controlCenter/` (all tabs)
- **Issue:** 3 of 4 tabs (workspace, activity, history) duplicate existing VS Code surfaces (Source Control, Timeline, Terminal).
- **Fix:** For this phase, keep the panel but shift its purpose: model selection, context management, session controls. Remove or deprioritize workspace-monitoring tabs. Revisit product scope before release.

**Finding OV7 — No conversation persistence (ACCEPTED)**
- **File:** `components/conversationView.ts`, `common/ominaiServices.ts`
- **Issue:** Messages live in ConversationView's in-memory DOM. Session switch = all messages lost. Overlay close/reopen = all messages lost.
- **Fix:** Add message storage to `IOminaiSessionService`. Persist to `IStorageService` or `IndexedDB`. Restore on session resume.

**Finding OV8 — Whole-DOM-rebuild pattern in 3 tabs (ACCEPTED)**
- **File:** `workspaceTab.ts:update()`, `activityTab.ts:renderSteps()`, `historyTab.ts:renderEntries()`
- **Issue:** Every update clears and rebuilds entire DOM subtree, killing listeners, losing focus state.
- **Fix:** Same as Finding 7A. Targeted DOM updates instead of full rebuild.

---

## Implementation Tasks

### Phase 1: Foundation Fixes (Effort: S, Risk: Low)
These are small, safe, independent fixes with no cross-file impact.

- [ ] **FIX-1A** — Switch tab components to use `createInstance` instead of `new`
  - Files: `ominaiWorkspaceOverlay.ts:51-62`
  - Pattern: `WorkspaceTab(workspacePane)` → `this.instantiationService.createInstance(WorkspaceTab, workspacePane)`

- [ ] **FIX-2A** — Fix permissions mode storage type mismatch
  - File: `ominaiSettingsWindow.ts`
  - Change `setBoolean`/`getString` to consistent `setString`/`getString` across both callsites

- [ ] **FIX-2C** — Add mount guard to prevent duplicate DOM
  - File: `ominaiWorkspaceOverlay.ts:121`
  - Add: `if (this.container.parentElement) return;`

- [ ] **FIX-5A** — Normalize CSS prefixes to `.ominai-*`
  - Files: `media/ominai.css`, `workspaceTab.ts`, `activityTab.ts`
  - Migrate `.omini-*` → `.ominai-*`, `.omin-*` → `.ominai-*`

- [ ] **FIX-5B** — Remove dead `_onDidSubmitFirstPrompt` emitter
  - File: `components/promptInput.ts`
  - Delete emitter and event property

### Phase 2: Error Hardening (Effort: S, Risk: Low)
- [ ] **FIX-2B** — Add try/catch to `_onPromptSubmitted`
  - File: `ominaiWorkspaceOverlay.ts:100-118`

- [ ] **FIX-2D** — Add try/catch and singleton guard to `_openSettingsWindow`
  - File: `ominaiWorkspaceOverlay.ts:83-86`

- [ ] **FIX-1C** — Wrap setTimeout in disposable
  - File: `ominaiWorkspaceOverlay.ts:112`
  - Replace `setTimeout(() => { ... }, 500)` with `addDisposableTimeout` pattern

- [ ] **FIX-4A** — Add debounce to prompt submission
  - File: `components/promptInput.ts`
  - 300ms debounce + disable send button during active response

- [ ] **FIX-4B** — Add singleton guard for settings window
  - File: `ominaiWorkspaceOverlay.ts:83`
  - Use `MutableDisposable` to track settings window instance

### Phase 3: Dead Code Removal (Effort: S, Risk: Low)
- [ ] **FIX-OV4** — Remove QuickSettings (unreachable) OR wire settings tab to show it inline
  - Files: `controlCenter/quickSettings.ts`, `controlCenter.ts`, `controlCenter/settingsTab.ts`

- [ ] **FIX-OV5** — Remove ProjectWorkspacePanel (dead code)
  - File: `components/projectWorkspacePanel.ts`

- [ ] **FIX-1B / FIX-OV5** — Extract shared section render helpers
  - New: `controlCenter/common/sectionRenderers.ts`
  - Move section builder logic from `workspaceTab.ts` to shared module

### Phase 4: Service Contract Fixes (Effort: M, Risk: Med)
- [ ] **FIX-OV1** — Add inference interface to IOminaiProviderService
  - File: `common/ominaiServices.ts`
  - Add: `complete(prompt, options)`, `stream(prompt, options)`, `cancel(requestId)`

- [ ] **FIX-OV2** — Audit and fix all 6 service contracts
  - `IOminaiSessionService`: Add message CRUD (getMessages, addMessage, clearMessages)
  - `IOminaiExecutionService`: Add `start()`, `stop()`, `observe()`
  - `IOminaiBrowserService`: Implement or remove
  - `IOminaiProviderService`: Add inference interface (see OV1)
  - `IOminaiProjectService`: Replace hardcoded strings with real data
  - `IOminaiLoggerService`: Verify (likely survives as-is)

- [ ] **FIX-OV7** — Add message persistence to IOminaiSessionService
  - Add `IStorageService` or `IndexedDB` persistence layer
  - Restore messages on session resume

- [ ] **FIX-OV3** — Fix layering violation (vs/ominai ← vs/sessions)
  - Extract shared mode constants to `src/vs/ominai/common/ominiMode.ts`
  - Update imports in both `ominaiWorkspace.contribution.ts` and `ominiModeSwitcher.ts`

### Phase 5: Observability & Testing (Effort: M, Risk: Low)
- [ ] **FIX-8A** — Add mock state transitions + trace logging
  - File: `ominaiMockServices.ts`
  - Add `fireTick()` helper to mock execution service
  - Add trace logging to all mock methods

- [ ] **FIX-6A** — Add unit tests
  - Priority: `MockOminaiExecutionService`, `MockOminaiSessionService`
  - Then: `WelcomeScreen`, `PromptInput`, `ConversationView`
  - Follow existing workbench test patterns

### Phase 6: Deployment & Strategic (Effort: M, Risk: Med)
- [ ] **FIX-9A** — Add feature flag for overlay registration
  - File: `ominaiWorkspace.contribution.ts`
  - Gate on `IProductService` or experiment service

- [ ] **FIX-10D / FIX-3A** — Connect settings to IStorageService
  - File: `ominaiSettingsWindow.ts`
  - Use `IStorageService` for toggle/mode persistence
  - Use secret storage for API keys
  - Pre-populate API key input with masked value

- [ ] **FIX-OV6** — Re-scope ControlCenter purpose
  - Shift from workspace monitoring to model selection + context management + session controls

### Phase 7: Long-term Hardening (Effort: L, Risk: Low)
- [ ] **FIX-10A** — Extract component initialization into named phases
  - File: `ominaiWorkspaceOverlay.ts`

- [ ] **FIX-10B** — Define focused interfaces for sub-surfaces
  - `IChatSurface`, `IControlCenter`, `ISettingsSurface`

- [ ] **FIX-10C** — Organize CSS by component with section headers
  - File: `media/ominai.css`

- [ ] **FIX-7A / FIX-OV8** — Replace DOM-rebuild patterns with targeted updates
  - Files: `workspaceTab.ts`, `activityTab.ts`, `historyTab.ts`

### UX & Accessibility (Effort: S, Risk: Low)
- [ ] **FIX-11A** — Add loading state skeleton for assistant responses
  - File: `components/conversationView.ts`

- [ ] **FIX-11B / FIX-1E** — Add ARIA live regions + tab ARIA roles
  - Files: `components/conversationView.ts`, `controlCenter/tabNavigation.ts`

---

## Implementation Tasks (JSONL)

```jsonl
{"id":"FIX-1A","title":"Switch tab components to use createInstance","phase":"1","effort":"S","risk":"low","files":["ominaiWorkspaceOverlay.ts"],"finding":"1A"}
{"id":"FIX-2A","title":"Fix permissions mode storage type mismatch","phase":"1","effort":"S","risk":"low","files":["ominaiSettingsWindow.ts"],"finding":"2A"}
{"id":"FIX-2C","title":"Add mount guard to prevent duplicate DOM","phase":"1","effort":"S","risk":"low","files":["ominaiWorkspaceOverlay.ts"],"finding":"2C"}
{"id":"FIX-5A","title":"Normalize CSS prefixes to .ominai-*","phase":"1","effort":"S","risk":"low","files":["media/ominai.css","workspaceTab.ts","activityTab.ts"],"finding":"5A"}
{"id":"FIX-5B","title":"Remove dead _onDidSubmitFirstPrompt emitter","phase":"1","effort":"S","risk":"low","files":["promptInput.ts"],"finding":"5B"}
{"id":"FIX-2B","title":"Add try/catch to _onPromptSubmitted","phase":"2","effort":"S","risk":"low","files":["ominaiWorkspaceOverlay.ts"],"finding":"2B"}
{"id":"FIX-2D","title":"Add try/catch and singleton guard to _openSettingsWindow","phase":"2","effort":"S","risk":"low","files":["ominaiWorkspaceOverlay.ts"],"finding":"2D"}
{"id":"FIX-1C","title":"Wrap setTimeout in disposable pattern","phase":"2","effort":"S","risk":"low","files":["ominaiWorkspaceOverlay.ts"],"finding":"1C"}
{"id":"FIX-4A","title":"Add debounce to prompt submission","phase":"2","effort":"S","risk":"low","files":["promptInput.ts"],"finding":"4A"}
{"id":"FIX-4B","title":"Add singleton guard for settings window","phase":"2","effort":"S","risk":"low","files":["ominaiWorkspaceOverlay.ts"],"finding":"4B"}
{"id":"FIX-OV4","title":"Remove or wire QuickSettings","phase":"3","effort":"S","risk":"low","files":["quickSettings.ts","controlCenter.ts","settingsTab.ts"],"finding":"OV4"}
{"id":"FIX-OV5","title":"Remove ProjectWorkspacePanel","phase":"3","effort":"S","risk":"low","files":["projectWorkspacePanel.ts"],"finding":"OV5"}
{"id":"FIX-1B","title":"Extract shared section render helpers","phase":"3","effort":"S","risk":"low","files":["controlCenter/common/sectionRenderers.ts"],"finding":"1B"}
{"id":"FIX-OV1","title":"Add inference interface to IOminaiProviderService","phase":"4","effort":"M","risk":"med","files":["common/ominaiServices.ts","ominaiMockServices.ts"],"finding":"OV1"}
{"id":"FIX-OV2","title":"Audit and fix all 6 service contracts","phase":"4","effort":"M","risk":"med","files":["common/ominaiServices.ts","ominaiMockServices.ts"],"finding":"OV2"}
{"id":"FIX-OV7","title":"Add message persistence to session service","phase":"4","effort":"M","risk":"med","files":["common/ominaiServices.ts","ominaiMockServices.ts","conversationView.ts"],"finding":"OV7"}
{"id":"FIX-OV3","title":"Fix layering violation with sessions layer","phase":"4","effort":"M","risk":"med","files":["ominaiWorkspace.contribution.ts","common/ominiMode.ts"],"finding":"OV3"}
{"id":"FIX-8A","title":"Add mock state transitions and trace logging","phase":"5","effort":"M","risk":"low","files":["ominaiMockServices.ts"],"finding":"8A"}
{"id":"FIX-6A","title":"Add unit tests for core components","phase":"5","effort":"M","risk":"low","files":["components/*.ts","controlCenter/*.ts"],"finding":"6A"}
{"id":"FIX-9A","title":"Add feature flag for overlay registration","phase":"6","effort":"S","risk":"med","files":["ominaiWorkspace.contribution.ts"],"finding":"9A"}
{"id":"FIX-10D","title":"Connect settings to IStorageService","phase":"6","effort":"M","risk":"med","files":["ominaiSettingsWindow.ts"],"finding":"10D"}
{"id":"FIX-OV6","title":"Re-scope ControlCenter purpose","phase":"6","effort":"M","risk":"med","files":["controlCenter/*.ts"],"finding":"OV6"}
{"id":"FIX-10A","title":"Extract component init into named phases","phase":"7","effort":"L","risk":"low","files":["ominaiWorkspaceOverlay.ts"],"finding":"10A"}
{"id":"FIX-10B","title":"Define focused interfaces for sub-surfaces","phase":"7","effort":"M","risk":"low","files":["common/ominaiServices.ts"],"finding":"10B"}
{"id":"FIX-10C","title":"Organize CSS by component with section headers","phase":"7","effort":"L","risk":"low","files":["media/ominai.css"],"finding":"10C"}
{"id":"FIX-7A","title":"Replace DOM-rebuild patterns with targeted updates","phase":"7","effort":"L","risk":"low","files":["workspaceTab.ts","activityTab.ts","historyTab.ts"],"finding":"7A"}
{"id":"FIX-11A","title":"Add loading state for assistant responses","phase":"7","effort":"S","risk":"low","files":["conversationView.ts","chatMessage.ts"],"finding":"11A"}
{"id":"FIX-11B","title":"Add ARIA live regions and tab roles","phase":"7","effort":"S","risk":"low","files":["conversationView.ts","tabNavigation.ts"],"finding":"11B"}
```

---

## NOT in Scope

The following were considered during the review and explicitly deferred:

- **Real LLM API integration** — This is the next logical step after foundation hardening, but outside the scope of this review.
- **Extension packaging** — OMINAI is currently compiled into the workbench directly. Extension/host-process separation is a future concern.
- **Multi-workspace support** — Single workspace only. Multiple project contexts are deferred.
- **Collaboration features** — No multi-user or shared session support planned.
- **Offline mode** — No graceful degradation when offline.
- **Performance benchmarking** — No load testing or memory profiling. DOM patterns noted as future concern but not benchmarked.
- **Cross-platform testing** — Windows-only assumption in this phase. Linux/Mac edge cases not verified.
- **i18n / localization** — UI strings are hardcoded in English. NLS externalization deferred.
- **Extension API surface** — No public API for third-party extensions to interact with OMINAI.
- **CI/CD pipeline** — No automated build or test pipeline for the OMINAI layer specifically.

---

## What Already Exists

The following existing code/flows already solve sub-problems identified during review:

- **VS Code `IStorageService`** — Already provides workspace-scoped and global storage. Available via DI in any component. Solves settings persistence (Finding 10D, OV4).
- **VS Code `ISecretStorageService`** — Provides encrypted credential storage. Should replace the in-memory API key management in OminaiSettingsWindow (Finding 3A).
- **VS Code `IExperimentService`** — Provides A/B experiment gating. Available for feature flagging the overlay (Finding 9A).
- **VS Code `AccessibilityService`** — Provides screen reader announcements via `IAccessibilityService.alert()`. Can replace hand-rolled ARIA live regions (Finding 11B).
- **VS Code `IWorkbenchContributionsRegistry`** — Already used in `ominaiWorkspace.contribution.ts`. Accepts `WorkbenchPhase` for deferred registration. Gate point for feature flag.
- **VS Code `DisposableStore` / `MutableDisposable`** — Available in `vs/base/common/lifecycle.js`. Should be used for the setTimeout management (Finding 1C).
- **VS Code `EventBufferer` / `EventDebouncer`** — Available for input rate-limiting (Finding 4A) via `vs/base/common/event.ts`.
- **Existing workbench test patterns** — `src/vs/workbench/test/browser/` provides `TestInstantiationService`, `ITestService`, and fixture patterns for unit testing (Finding 6A).
- **Existing `vs/workbench/browser/parts/editor/`** — Already uses the editor part container pattern OMINAI reuses. Mounting strategy is validated by precedent.

---

## Dream State Delta

Where this plan leaves us relative to a 12-month ideal:

| Dimension | After Phase 1-7 | 12-month Ideal | Delta |
|---|---|---|---|
| **Error resilience** | try/catch in all handlers, disposable timeout, singleton guards | Full error boundary per component, graceful degradation per service failure, auto-retry | Service-level resilience not addressed |
| **Tests** | Unit tests for core components + mock services | Integration tests + E2E tests + performance regression suite | E2E gap remains |
| **Settings** | Connected to IStorageService, API keys in secret storage | Real-time sync, cloud profiles, import/export | Basic persistence only |
| **Provider model** | Inference interface defined, 33 providers modeled | Dynamic provider discovery, cost-based routing, fallback chains | Provider abstraction validated but static |
| **Conversation** | Messages persist across sessions | Full history search, branching conversations, export/import | History is linear — no branching, no search |
| **Architecture** | Lazy-loaded components, focused interfaces, separated concerns | Plugin architecture, extensible by third-party extensions | Monolithic decomposition, not yet extensible |
| **CSS** | Component-scoped CSS with consistent prefixes | Design token system, theme-aware components, CSS modules | Token system exists but no component scoping |
| **Code quality** | Consistent prefixes, no dead code, DI everywhere | Lint-enforced conventions, architectural fitness functions | Manual enforcement, no automation |
| **Strategic focus** | Right panel re-scoped to AI-specific controls | Deep VS Code integration (inline edits, diff views, refactoring previews) | Surface-level integration — not yet deeply embedded |
| **Accessibility** | ARIA live regions, tab roles, loading states | Full WCAG 2.1 AA compliance, keyboard-navigable everything, screen reader testing | Baseline only |

---

## Error & Rescue Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
|---|---|---|---|---|---|
| `_onPromptSubmitted` | Exception in welcomeScreen.hide / conversationView.show / addMessage | ❌ No try/catch | ❌ | Overlay crash | ❌ |
| `_onPromptSubmitted` | setTimeout fires after dispose | ❌ No disposable | ❌ | Null ref | ❌ |
| `_openSettingsWindow` | Exception during createInstance | ❌ No try/catch | ❌ | Blank settings | ❌ |
| `_openSettingsWindow` | Multiple concurrent instances | ❌ No guard | ❌ | Duplicate windows | ❌ |
| `mount()` | Called twice (duplicate DOM) | ❌ No guard | ❌ | Double rendering | ❌ |
| `PromptInput.onDidSubmitPrompt` | Rapid fire (spam enter) | ❌ No debounce | ❌ | Overlapping responses | ❌ |
| `MockOminaiExecutionService` | onDidChangeExecutionState never fires | ❌ Dead emitter | ❌ | Dead subscribers | ❌ |
| `OminaiSettingsWindow` | API key edit clears value | ❌ No pre-populate | ❌ | Lost credentials | ❌ |
| `OminaiSettingsWindow` | Settings reset on close | ❌ In-memory only | ❌ | All config lost | ❌ |
| `QuickSettings` | Settings tab cannot show QuickSettings | ❌ Dead code | ❌ | Nothing visible | ❌ |
| `ProjectWorkspacePanel` | Never instantiated | ❌ Dead code | ❌ | N/A | ❌ |
| `WorkspaceTab.update()` | Listener leak on DOM rebuild | ❌ textContent = '' | ❌ | Ghost listeners | ❌ |
| `IOminaiProviderService` | No inference interface exists | ❌ Missing contract | ❌ | No completions work | ❌ |
| `OMINI_MODE` import | Circular dependency between layers | ❌ Not addressed | ❌ | Compiler error | ❌ |

---

## Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
|---|---|---|---|---|---|
| Editor part container unavailable | `mount()` falls back to `onDidLayoutMainContainer` | ✅ Retry on layout event | ❌ | Brief delay | ❌ |
| `OminaiWorkspaceOverlay` instantiation | `console.error` + `window.alert` in contribution | ✅ Console + alert | ❌ | Alert dialog | ❌ |
| Settings window disposal | `_register(win)` chains disposal | ✅ DI handles lifecycle | ❌ | N/A | ❌ |
| ModelSelector click-outside | `addDisposableListener` on `mainWindow` mouse down | ✅ Properly disposable | ❌ | N/A | ❌ |
| WelcomeScreen chip key handlers | `preventDefault()` on Enter/Space | ✅ Keyboard accessible | ❌ | N/A | ❌ |
| ExecutionPanel state toggling | Icon/class swap | ✅ Direct DOM mutation | ❌ | Works | ❌ |

---

## Mandatory Diagrams

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VS Code Workbench                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Editor Part (Parts.EDITOR_PART)                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐    │   │
│  │  │  OminaiWorkspaceOverlay (z-index: 100, absolute positioned)  │    │   │
│  │  │                                                                │    │   │
│  │  │  ┌──────────────────────┐  ┌─────────────────────────────┐   │    │   │
│  │  │  │  Chat Area           │  │  Right Panel                │   │    │   │
│  │  │  │  ┌────────────────┐  │  │  ┌───────────────────────┐  │   │    │   │
│  │  │  │  │ WelcomeScreen  │  │  │  │ TabNavigation        │  │   │    │   │
│  │  │  │  │ - Logo         │  │  │  │ - Workspace Tab      │  │   │    │   │
│  │  │  │  │ - Action Cards │  │  │  │ - Activity Tab       │  │   │    │   │
│  │  │  │  │ - Chips        │  │  │  │ - History Tab        │  │   │    │   │
│  │  │  │  └────────────────┘  │  │  │ - Settings Tab       │  │   │    │   │
│  │  │  │  ┌────────────────┐  │  │  └───────────────────────┘  │   │    │   │
│  │  │  │  │ Conversation   │  │  │  ┌───────────────────────┐  │   │    │   │
│  │  │  │  │ View           │  │  │  │ Tab Content Panes     │  │   │    │   │
│  │  │  │  │ - ChatMessage  │  │  │  │ - WorkspaceTab        │  │   │    │   │
│  │  │  │  │ - ExecutionPanel│  │  │  │ - ActivityTab         │  │   │    │   │
│  │  │  │  └────────────────┘  │  │  │ - HistoryTab          │  │   │    │   │
│  │  │  │  ┌────────────────┐  │  │  │ - QuickSettings(dead) │  │   │    │   │
│  │  │  │  │ PromptInput    │  │  │  └───────────────────────┘  │   │    │   │
│  │  │  │  │ - Textarea     │  │  │                             │   │    │   │
│  │  │  │  │ - SendButton   │  │  │  ┌───────────────────────┐  │   │    │   │
│  │  │  │  │ - ModelBtn     │  │  │  │ OminaiSettingsWindow  │  │   │    │   │
│  │  │  │  └────────────────┘  │  │  │ (12 categories, modal) │  │   │    │   │
│  │  │  │                      │  │  │ - In-memory store     │  │   │    │   │
│  │  │  └──────────────────────┘  │  └───────────────────────┘  │   │    │   │
│  │  │                            │                             │   │    │   │
│  │  │  ModelSelector (floating)  │                             │   │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  DI Services (singletons, registered Delayed)                        │   │
│  │  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐              │   │
│  │  │ Session     │  │ Execution     │  │ Provider     │              │   │
│  │  │ Service     │  │ Service       │  │ Service      │              │   │
│  │  └─────────────┘  └───────────────┘  └──────────────┘              │   │
│  │  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐              │   │
│  │  │ Project     │  │ Logger        │  │ Browser      │              │   │
│  │  │ Service     │  │ Service       │  │ Service      │ (empty)      │   │
│  │  └─────────────┘  └───────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Prompt Submission

```
User types text + presses Enter
         │
         ▼
  PromptInput.onDidSubmitPrompt(text)
         │
         ▼
  OminaiWorkspaceOverlay._onPromptSubmitted(text)
         │
         ├──► welcomeScreen.hide()
         ├──► conversationView.show()
         ├──► promptInput.animateToBottom()
         │
         ├──► conversationView.addMessage({role: 'user', content: text})
         │
         └──► setTimeout (500ms)
                  │
                  ▼
            conversationView.addMessage({
              role: 'assistant',
              content: 'I am analyzing...',
              showExecutionPanel: true
            })
                  │
                  ▼
            ChatMessage creates ExecutionPanel
                  │
                  ▼
            ExecutionPanel.subscribes to
            onDidChangeExecutionState  ← NEVER FIRES (mock bug)
```

### State Machine: Workspace Overlay

```
  ┌──────────┐   mount()   ┌──────────┐   show()   ┌──────────┐
  │ UNMOUNTED │──────────►│  HIDDEN   │──────────►│  ACTIVE   │
  └──────────┘            └──────────┘            └──────────┘
                             ▲                        │
                             │      hide()            │
                             └────────────────────────┘
                                                      │
                                           dispose()  │
                                                      ▼
                                                ┌──────────┐
                                                │ DISPOSED  │
                                                └──────────┘

Within ACTIVE state, sub-states for chat flow:

  ┌────────────────────────────────────────────────────────────────┐
  │  ACTIVE                                                        │
  │  ┌────────────┐   submit   ┌──────────────┐   response   ┌──┐ │
  │  │ WELCOME    │──────────►│  AWAITING     │────────────►│ IDLE│ │
  │  │ (default)  │            │  RESPONSE     │              └──┘ │
  │  └────────────┘            └──────────────┘              ▲     │
  │        │                       │                         │     │
  │        │ user clears           │ error/                  │     │
  │        │ conversation          │ timeout                 │     │
  │        └───────────────────────┴─────────────────────────┘     │
  └────────────────────────────────────────────────────────────────┘
```

### Error Flow

```
Exception occurs in any handler
         │
         ▼
  ┌─────────────────────┐
  │ try/catch present?   │
  └─────────────────────┘
         │          │
        YES         NO
         │          │
         ▼          ▼
  Log error    ┌──────────────────────┐
  + show       │ Uncaught exception   │
  fallback UI  │ kills the handler    │
               │ chain silently       │
               └──────────────────────┘
                         │
                         ▼
                  ┌──────────────────────┐
                  │ Next user action may  │
                  │ fail with null ref    │
                  └──────────────────────┘

Current state: Most handlers lack try/catch (Findings 2B, 2D)
Target state: All handlers wrapped, errors logged + fallback UI shown
```

### Deployment Sequence

```
Phase 1 ───► Foundation Fixes (Effort: S)
              FIX-1A, 2A, 2C, 5A, 5B
              │
              ▼
Phase 2 ───► Error Hardening (Effort: S)
              FIX-2B, 2D, 1C, 4A, 4B
              │
              ▼
Phase 3 ───► Dead Code Removal (Effort: S)
              FIX-OV4, OV5, 1B
              │
              ▼
Phase 4 ───► Service Contracts (Effort: M)
              FIX-OV1, OV2, OV7, OV3
              │
              ▼
Phase 5 ───► Observability & Tests (Effort: M)
              FIX-8A, 6A
              │
              ▼
Phase 6 ───► Deployment & Strategic (Effort: M)
              FIX-9A, 10D, OV6
              │
              ▼
Phase 7 ───► Long-term Hardening (Effort: L)
              FIX-10A, 10B, 10C, 7A, 11A, 11B
```

### Rollback Flowchart

```
┌────────────────────────────────────┐
│ Deploy phase to branch             │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ TypeScript check passes?           │
│ (tsc --noEmit --skipLibCheck)      │
└────────────────────────────────────┘
    YES           NO
     │             │
     ▼             ▼
┌────────────┐  ┌──────────────────────┐
│ Run tests  │  │ Fix TS errors,       │
└────────────┘  │ recommit, recheck    │
     │          └──────────────────────┘
     ▼
┌────────────────────────────────────┐
│ Tests pass?                         │
└────────────────────────────────────┘
    YES           NO
     │             │
     ▼             ▼
┌────────────┐  ┌──────────────────────┐
│ Review     │  │ Fix tests, recommit, │
│ manually   │  │ recheck              │
└────────────┘  └──────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ Merge to main branch              │
└────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ Run overlay:                       │
│ - Workspace opens?                 │
│ - Prompt input works?              │
│ - Settings open?                   │
│ - Feature flag toggles?            │
└────────────────────────────────────┘
    ALL OK        ISSUE
     │             │
     ▼             ▼
┌────────────┐  ┌──────────────────────┐
│ Deploy     │  │ Roll back commit(s)  │
│ proceed    │  │ + fix + recommit     │
└────────────┘  └──────────────────────┘
```

---

## Review Readiness Dashboard

| Criterion | Status | Notes |
|---|---|---|
| **TypeScript strict-mode compile** | ✅ PASS | `tsc --noEmit --skipLibCheck` passes |
| **Mock services: fallback behavior documented** | ❌ FAIL | No mock service documents its null/undefined behavior |
| **No orphaned CSS or duplicate rules** | ❌ FAIL | 3 prefix conventions coexist; some rules unreferenced |
| **Disposables correctly chained** | ⚠️ WARN | setTimeout not wrapped; WorkspaceTab never disposes old DOM |
| **Edge cases mapped per component** | ❌ FAIL | No loading/empty/error states documented |
| **Settings window closes cleanly** | ⚠️ WARN | Multiple instances possible; no singleton guard |
| **Welcome screen / chat transition smooth** | 🟡 PENDING | No loading state; visual jank possible on response delay |
| **Feature flag present** | ❌ FAIL | Overlay compiles unconditionally |
| **Test coverage > 0** | ❌ FAIL | Zero tests |
| **Provider model has inference interface** | ❌ FAIL | No `complete()`, `stream()`, `cancel()` |
| **Service contracts describe behavior** | ❌ FAIL | All 6 are data-snapshot interfaces only |
| **Layering rules enforced** | ⚠️ WARN | vs/ominai imports from vs/sessions (reverse dependency) |
| **Settings persistence functional** | ❌ FAIL | In-memory only, resets on close |
| **No dead code** | ❌ FAIL | ProjectWorkspacePanel + QuickSettings unreachable |
| **DOM rebuild pattern safe** | ❌ FAIL | 3 tabs use full-rebuild pattern |

**Overall Readiness: 2/15 passing** — The scaffold compiles but lacks hardening, testing, persistence, accessibility, and proper service contracts. Not ready for release. Ready for continued development after Phase 1-3.

---

## Recommended Next Reviews

Based on the review findings and current state, the following follow-up reviews are recommended:

1. **/plan-eng-review** (REQUIRED GATE) — Before merging any Phase 1-3 implementation. The engineering review will verify the foundation fixes were applied correctly and check for regressions. Required because the service contract fixes (Phase 4) change the architectural surface.

2. **/plan-design-review** (RECOMMENDED) — Before merging Phase 6 (ControlCenter re-scope) and Phase 7 (UX hardening). The design review should focus on:
   - Right panel layout and purpose shift
   - Loading state skeleton design
   - Accessible tab navigation pattern
   - Settings window modal vs. inline UX
   - Responsive layout at various editor sizes

3. **/investigate** (CONDITIONAL) — If real LLM integration discovers unexpected behavior in the mock service boundaries, run `/investigate` on the integration point before building more features on top.

---

## Learnings

- **Provider abstraction before inference interface** — Building a provider model (tiers, roles, assignment UI) before defining the inference interface (`complete`, `stream`, `cancel`) is premature abstraction. Build the data plane first.
- **Dead code detection** — Two components (ProjectWorkspacePanel, QuickSettings) were found dead during the outside voice review but not during the 11-section review. Suggest adding automated tree-shaking analysis to future reviews.
- **Outside voice pattern** — The Claude subagent found 8 issues the structured 11-section review missed, primarily strategic/architectural rather than tactical. Valuable complement.
- **Settings persistence as product litmus test** — A 580-line settings UI that discards all input is a strong signal that the product model hasn't converged. When a UI is "theater," the product is still in exploration phase.
- **HOLD SCOPE mode proved useful** — Maximum rigor caught 24 findings across 11 sections. The outside voice added 8 more. Combined total of 32 findings for 26 files suggests good density.

---

*Report generated by /plan-ceo-review (HOLD SCOPE mode) on 2026-07-28*
*Review conducted on branch `omini-main`*
*Design doc: Administrator-omini-main-design-20260728-130802.md*
