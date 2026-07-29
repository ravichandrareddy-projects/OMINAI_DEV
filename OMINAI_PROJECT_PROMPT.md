# OMINAI — Full Project Context & Next Phase Planning Prompt

> **Share this entire document with Claude to continue building OMINAI.**
> Last updated: 2026-07-28

---

## 🧠 What is OMINAI?

OMINAI is a **next-generation agentic AI IDE** built directly inside **VS Code (from source)**. It is not an extension — it lives in the core workbench itself, rendered as a full-screen overlay over the editor area. Think Cursor AI meets Claude Computer Use, but integrated at the VS Code kernel level with full access to the platform's DI (Dependency Injection) system, storage, layout services, and extension host.

The goal is to build an AI agent workspace that can:
1. Accept natural language task prompts from the user
2. Autonomously plan, reason, and execute multi-step coding/browser/terminal tasks
3. Display the execution state in real-time in a beautiful Control Center panel
4. Integrate a powerful browser automation engine (the **next phase**)
5. Route tasks to the best AI model using a task-role assignment system

---

## 📁 Project File Structure

All OMINAI source lives inside the VS Code source tree at:

```
d:\OMINI\   (the VS Code root, branch: omini-main)
```

### Core OMINAI Source Files

```
src/vs/ominai/
├── common/
│   ├── ominaiServices.ts          # All service interfaces (DI contracts)
│   └── ominiMode.ts               # OMINIMode enum + context key (Code vs OMINI)
│
└── browser/
    ├── ominaiWorkspace.contribution.ts   # Workbench contribution entry point
    ├── ominaiWorkspaceOverlay.ts         # Root overlay: mounts chat + right panel
    ├── ominaiMockServices.ts             # Mock implementations of all services
    │
    ├── components/
    │   ├── welcomeScreen.ts              # Hero screen with logo + suggestion chips
    │   ├── promptInput.ts                # Floating textarea with model selector + controls
    │   ├── conversationView.ts           # Chat message feed (user + assistant)
    │   ├── chatMessage.ts                # Individual message bubble
    │   ├── executionPanel.ts             # Collapsible inline execution steps panel
    │   ├── modelSelector.ts              # Dropdown model picker (all providers)
    │   └── projectWorkspacePanel.ts      # (placeholder)
    │
    ├── controlCenter/
    │   ├── controlCenter.ts              # Right panel container: tabs + settings button
    │   ├── tabNavigation.ts              # Tab bar: Workspace | Activity | History
    │   ├── workspaceTab.ts               # Workspace tab: project status, execution, browser
    │   ├── activityTab.ts                # Activity tab: execution timeline steps
    │   ├── historyTab.ts                 # History tab: past sessions list
    │   ├── quickSettings.ts              # (legacy - now replaced by settings button)
    │   ├── settingsTab.ts                # (legacy stub)
    │   └── settings/
    │       ├── modelsSettings.ts         # Task-role → model assignment UI
    │       ├── aiSettings.ts             # AI behavior settings
    │       ├── appearanceSettings.ts     # (legacy - removed from sidebar)
    │       ├── browserSettings.ts        # Browser automation settings
    │       ├── labsSettings.ts           # Experimental features
    │       └── workspaceSettings.ts      # Workspace indexing settings
    │
    ├── settingsWindow/
    │   └── ominaiSettingsWindow.ts       # Full-screen settings overlay (like Cursor settings)
    │                                     # Categories: General, Account, Permissions,
    │                                     # Notifications, Models, Browser, Tab, Editor,
    │                                     # Workspace, Labs
    │
    └── media/
        └── ominai.css                    # All OMINAI styles (~2600 lines)
```

### VS Code Integration Points

```
src/vs/sessions/contrib/omini/browser/
└── ominiModeSwitcher.contribution.ts     # Adds OMINI mode toggle button to the title bar
                                          # (switches between Code mode and OMINI mode)
```

---

## 🏗️ Architecture Overview

### Entry Point & Lifecycle

```
VS Code starts
  → registerWorkbenchContribution2(OminaiWorkspaceContribution, WorkbenchPhase.AfterRestored)
    → OminaiWorkspaceContribution constructor
      → Registers onDidChangeOMINIMode listener
      → Creates OminaiWorkspaceOverlay (mounts to editor DOM)
      → Registers commands: ominai.workspace.open, ominai.session.new
```

### Mode Switching

- `OMINIMode.Code` → overlay hidden, normal VS Code
- `OMINIMode.OMINI` → overlay shown, full-screen OMINAI workspace
- Toggled via a button in the VS Code title bar (ominiModeSwitcher)
- Context key: `omini.mode` stored in `IContextKeyService`

### Overlay Layout

```
OminaiWorkspaceOverlay (position: absolute, covers editor area)
├── .ominai-chat-area (flex: 1)
│   ├── ConversationView      — scrollable message feed
│   ├── WelcomeScreen         — shown until first message
│   └── PromptInput           — floating at bottom, centered initially
│
└── .ominai-right-panel (width: 320px)
    └── ControlCenter
        ├── TabNavigation     — Workspace | Activity | History
        ├── [Tab Panes]
        │   ├── WorkspaceTab  — project card, execution status, browser status
        │   ├── ActivityTab   — step-by-step timeline
        │   └── HistoryTab    — past session cards
        └── ⚙ Settings Button → opens OminaiSettingsWindow overlay
```

### Settings Window

Full-screen modal overlay (like Cursor's settings). Opens when user clicks the ⚙ gear button at the top-right of the Control Center.

Categories (left sidebar nav):
- **General** — language, compact mode, animations, restore session, layout
- **Account** — profile card, API keys (OpenAI, Anthropic, Gemini, Perplexity)
- **Permissions** — security mode (Full/Sandboxed/Strict), terminal, file access, planning, network
- **Notifications** — task events, sound
- **Models** — task-role assignment (which AI model handles which task type)
- **Browser** — browser automation config
- **Tab** — panel defaults
- **Editor** — inline suggestions, auto-apply, diff view
- **Workspace** — indexing, ignored paths, memory, git
- **Labs** — experimental features (voice, vision, MCP, autonomous agent)

---

## 🧩 Service Layer

All services follow VS Code's DI pattern with `createDecorator` and `registerSingleton`.

### `IOminaiSessionService`
Manages chat sessions (create, delete, rename, switch). Currently mock.

### `IOminaiExecutionService`
Tracks execution steps and state (`idle | running | completed | error`). Currently mock.

### `IOminaiBrowserService`
Placeholder for browser automation integration. Empty interface, ready to be implemented.

### `IOminaiProjectService`
Provides project name, current task, and progress %. Currently mock.

### `IOminaiLoggerService`
Wraps `console.log` with OMINAI prefix and severity levels (`trace`, `info`, `warn`, `error`).

### `IOminaiProviderService`
Manages AI providers and task-role assignments:
- Providers: Claude Opus/Sonnet/Haiku, GPT-4o/4.1, Gemini 2.5 Pro/Flash, Perplexity, Grok, DeepSeek, Qwen, Mistral, local models
- Task roles: architecture, coding, reasoning, research, debugging, writing, creative, browser, vision, analysis, security, performance, testing, documentation
- Each role can have multiple assigned providers, one marked as primary

---

## 🎨 Design System

- **Colors**: Follow VS Code theme tokens (light/dark adaptive)
- **Accent**: `--omini-accent: #a87ffb` (purple)
- **Fonts**: Inherit VS Code font stack
- **Animations**: Smooth 0.2s ease transitions on all interactive elements
- **Scrollbars**: Hidden (scrollbar-width: none) but functional
- **Buttons**: All have border-radius 6px, smooth transitions, focus-visible outlines
- **Settings Window**: 1100×760px (96vw × 92vh max), 12px border-radius, 64px shadow

---

## ✅ What Has Been Built (Completed Features)

1. ✅ **Mode toggle** in VS Code title bar (Code ↔ OMINI)
2. ✅ **Full-screen chat overlay** with welcome screen + prompt input
3. ✅ **Conversation feed** with user/assistant message bubbles
4. ✅ **Inline execution panel** (collapsible, shows steps)
5. ✅ **Model selector dropdown** in prompt input bar
6. ✅ **Control Center** right panel with 3 tabs (Workspace / Activity / History)
7. ✅ **Workspace Tab** — project card, exec status, browser status section
8. ✅ **Activity Tab** — timeline of execution steps with status dots
9. ✅ **History Tab** — past session cards with status badges + detail icons
10. ✅ **Settings button** (⚙ gear) in top-right of Control Center — opens full settings window
11. ✅ **Settings Window** — full-screen overlay with left-sidebar navigation, 10 categories
12. ✅ **Models Settings** — full task-role assignment UI with provider cards and chip display
13. ✅ **Permissions Settings** — security mode cards + granular toggles
14. ✅ **All settings categories** built with toggles, dropdowns, API key rows, textareas
15. ✅ **Service layer** — 6 service interfaces + mock implementations
16. ✅ **DI wiring** — all services registered as singletons, injected via decorators

---

## 🚀 Next Phase: Browser Engine + Agentic Workflow

This is what I need to plan with you now. Here is the target architecture:

### Phase 2A: Browser Engine (`IOminaiBrowserService` implementation)

The `IOminaiBrowserService` interface is already defined and registered. Now we need to implement it. The goal is a **browser automation service** that:

- Uses **Playwright** (already in VS Code's `node_modules` as `playwright-core`) to control a Chromium browser
- Runs headlessly or visibly based on user settings
- Exposes actions to the agentic runtime: `navigate(url)`, `click(selector)`, `type(text)`, `screenshot()`, `extractDOM()`, `executeScript(js)`
- Streams real-time browser state back to the `WorkspaceTab` (screenshot thumbnails, current URL, page title)
- Integrates with the **browser-use** pattern: the AI agent describes what to do, and the browser service executes it

Key files to create:
```
src/vs/ominai/node/
└── browser/
    ├── ominaiPlaywrightService.ts    # Real implementation of IOminaiBrowserService
    ├── browserSession.ts             # Per-session browser instance manager
    └── domExtractor.ts               # Extracts structured DOM for AI context
```

### Phase 2B: Agentic Execution Runtime

The agentic runtime is the core loop that:
1. Takes a user prompt
2. Plans a task DAG (directed acyclic graph of steps)
3. Executes steps: terminal commands, file edits, browser actions, API calls
4. Reports progress to `IOminaiExecutionService` (shown in Activity Tab)
5. Handles errors, retries, and human-in-the-loop interrupts

Key design decisions needed:
- **Planning**: Should we use structured output from the AI (JSON task plan) or streaming reasoning?
- **Tool protocol**: MCP (Model Context Protocol) vs custom tool definitions?
- **Step execution**: Sequential vs parallel (some steps can run concurrently)
- **State persistence**: Where do we store the active task state? (IStorageService, IndexedDB, file?)
- **Interrupt mechanism**: How does the user pause/cancel mid-task?

### Phase 2C: AI Provider Integration

Replace mock responses with real AI completions:
- Wire up the Anthropic SDK (`@anthropic-ai/sdk` — already in package.json!) to Claude
- Wire up OpenAI SDK for GPT models
- Route completions through `IOminaiProviderService` task-role assignments
- Implement streaming responses that update the conversation view in real-time

---

## 🤔 Questions for Planning with Claude

1. **Browser Engine Architecture**: Should `ominaiPlaywrightService.ts` run in the main Electron process (where Node.js is available) or in the extension host? What are the IPC implications?

2. **Task Planning Format**: What's the ideal JSON schema for a task plan that an LLM can generate and an executor can reliably run? Include tool calls, branching, and error recovery.

3. **MCP vs Custom Tools**: Should we implement the Model Context Protocol for tool definitions, or build a simpler custom tool interface first and migrate later?

4. **Browser Context**: How do we pass browser state (DOM snapshot, screenshot) to the AI efficiently without hitting context window limits?

5. **Real-time Streaming**: How do we pipe streaming SSE from the Anthropic/OpenAI API through VS Code's main→renderer IPC to update the conversation view in real-time?

6. **File Structure for Phase 2**: What's the cleanest way to structure the new `node/` layer for browser + execution without coupling it to the browser layer?

---

## 📌 Technical Constraints

- **Runtime**: Electron (Chromium + Node.js), not a web browser
- **Language**: TypeScript (strict), ES modules
- **Build**: Gulp + esbuild (transpile-only for fast iteration), `npm run watch`
- **Launch**: `.\scripts\code.bat` — runs VS Code from sources
- **No webpack** for OMINAI files — they are compiled with the main VS Code build pipeline
- **Platform**: Windows (primary development), Linux/macOS compatible
- **Node version**: 24.x
- **Electron version**: 42.x
- **Playwright**: Already installed as `playwright-core@1.61.0-alpha`

---

## 🛠️ How to Run

```powershell
# From d:\OMINI
.\scripts\code.bat
```

Then in VS Code, open the Command Palette and run:
```
OMINAI: Open Workspace
```

Or click the OMINI toggle button in the title bar.

---

## 💡 Key Insight

OMINAI is not a VS Code extension — it is **built into VS Code itself**. This means:
- Full access to ALL VS Code platform services (no API surface limitations)
- Can modify the workbench DOM directly
- Has access to Node.js APIs in both the main process and renderer (via contextBridge if needed)
- Can spawn child processes, control the filesystem, and manage Electron windows natively
- The browser automation service can run Playwright directly from Node.js in the main process

This architectural decision gives OMINAI capabilities that no extension-based AI tool (Copilot, Cursor extension) can match.

---

*End of context document. Share this with Claude to plan Phase 2: Browser Engine + Agentic Workflow.*
