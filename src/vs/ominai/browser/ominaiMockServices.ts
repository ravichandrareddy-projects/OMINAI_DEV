/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../base/common/event.js';
import { generateUuid } from '../../base/common/uuid.js';
import { IOminaiSession, IOminaiSessionService, IOminaiExecutionService, ExecutionState, IExecutionStep, IOminaiProjectService, IOminaiLoggerService, IOminaiBrowserService, IAdapterResult, adapterResultOk } from '../common/ominaiServices.js';
import { Disposable } from '../../base/common/lifecycle.js';

export class MockOminaiSessionService extends Disposable implements IOminaiSessionService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeSessions = this._register(new Emitter<void>());
	readonly onDidChangeSessions: Event<void> = this._onDidChangeSessions.event;

	private readonly _onDidChangeActiveSession = this._register(new Emitter<IOminaiSession | undefined>());
	readonly onDidChangeActiveSession: Event<IOminaiSession | undefined> = this._onDidChangeActiveSession.event;

	private sessions: IOminaiSession[] = [];
	private activeSessionId: string | undefined;

	constructor() {
		super();
		this.createSession(); // create an initial session
	}

	getSessions(): readonly IOminaiSession[] {
		return this.sessions;
	}

	getActiveSession(): IOminaiSession | undefined {
		return this.sessions.find(s => s.id === this.activeSessionId);
	}

	createSession(): IOminaiSession {
		const session: IOminaiSession = {
			id: generateUuid(),
			title: 'New Session',
			createdAt: Date.now(),
			lastAccessedAt: Date.now()
		};
		this.sessions.push(session);
		this.activeSessionId = session.id;
		this._onDidChangeSessions.fire();
		this._onDidChangeActiveSession.fire(session);
		return session;
	}

	deleteSession(id: string): void {
		this.sessions = this.sessions.filter(s => s.id !== id);
		if (this.activeSessionId === id) {
			this.activeSessionId = this.sessions.length > 0 ? this.sessions[this.sessions.length - 1].id : undefined;
			this._onDidChangeActiveSession.fire(this.getActiveSession());
		}
		this._onDidChangeSessions.fire();
	}

	renameSession(id: string, newTitle: string): void {
		const session = this.sessions.find(s => s.id === id);
		if (session) {
			session.title = newTitle;
			this._onDidChangeSessions.fire();
		}
	}

	switchSession(id: string): void {
		const session = this.sessions.find(s => s.id === id);
		if (session) {
			session.lastAccessedAt = Date.now();
			this.activeSessionId = id;
			this._onDidChangeActiveSession.fire(session);
		}
	}
}

export class MockOminaiExecutionService extends Disposable implements IOminaiExecutionService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeExecutionState = this._register(new Emitter<void>());
	readonly onDidChangeExecutionState: Event<void> = this._onDidChangeExecutionState.event;

	private steps: IExecutionStep[] = [
		{ id: '1', title: 'Planning', state: 'completed' },
		{ id: '2', title: 'Preparing Workspace', state: 'completed' },
		{ id: '3', title: 'Running Project', state: 'idle' },
	];

	private currentState: ExecutionState = 'idle';

	getSteps(): readonly IExecutionStep[] {
		return this.steps;
	}

	getCurrentState(): ExecutionState {
		return this.currentState;
	}

	/** Set execution state and notify listeners. */
	setCurrentState(state: ExecutionState): void {
		this.currentState = state;
		this._onDidChangeExecutionState.fire();
	}

	/** Replace the step list and notify listeners. */
	setSteps(steps: IExecutionStep[]): void {
		this.steps = steps;
		this._onDidChangeExecutionState.fire();
	}

	/** Convenience: update a single step's state by id. */
	updateStepState(stepId: string, state: ExecutionState): void {
		const step = this.steps.find(s => s.id === stepId);
		if (step) {
			step.state = state;
			this._onDidChangeExecutionState.fire();
		}
	}
}

export class MockOminaiProjectService extends Disposable implements IOminaiProjectService {
	declare readonly _serviceBrand: undefined;
	private readonly _onDidChangeProjectState = this._register(new Emitter<void>());
	readonly onDidChangeProjectState: Event<void> = this._onDidChangeProjectState.event;

	getProjectName(): string {
		return 'OMINAI Workspace UI';
	}
	getCurrentTask(): string {
		return 'Architecting modular UI components';
	}
	getProgress(): number {
		return 35;
	}
}

export class MockOminaiLoggerService implements IOminaiLoggerService {
	declare readonly _serviceBrand: undefined;

	trace(message: string, ...args: unknown[]): void { console.log(`[OMINAI Trace] ${message}`, ...args); }
	info(message: string, ...args: unknown[]): void { console.info(`[OMINAI Info] ${message}`, ...args); }
	warn(message: string, ...args: unknown[]): void { console.warn(`[OMINAI Warn] ${message}`, ...args); }
	error(message: string | Error, ...args: unknown[]): void { console.error(`[OMINAI Error]`, message, ...args); }
}

export class MockOminaiBrowserService extends Disposable implements IOminaiBrowserService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeBackendState = this._register(new Emitter<void>());
	readonly onDidChangeBackendState: Event<void> = this._onDidChangeBackendState.event;

	private _running = false;
	private _mockDelayMs = 500;
	private _mockProviderResponses = new Map<string, string>([
		['openai-gpt4', '[Mock OpenAI GPT-4] Response to: '],
		['anthropic-claude3', '[Mock Claude 3] Response to: '],
		['google-gemini', '[Mock Gemini] Response to: '],
		['chatgpt', '[Mock ChatGPT] Response to: '],
		['claude', '[Mock Claude] Response to: '],
	]);

	get isRunning(): boolean {
		return this._running;
	}

	async startBackend(): Promise<IAdapterResult> {
		if (this._running) {
			return adapterResultOk('backend_already_running');
		}
		await this._delay();
		this._running = true;
		this._onDidChangeBackendState.fire();
		console.info('[OMINAI BrowserMock] Backend started');
		return adapterResultOk();
	}

	async stopBackend(): Promise<IAdapterResult> {
		this._running = false;
		this._onDidChangeBackendState.fire();
		console.info('[OMINAI BrowserMock] Backend stopped');
		return adapterResultOk();
	}

	async runSinglePrompt(providerId: string, prompt: string): Promise<IAdapterResult> {
		if (!this._running) {
			return { success: false, error: 'OMINAI Mode is off. Call startBackend() first.', errorCode: 'NOT_INITIALIZED' };
		}
		await this._delay();
		const prefix = this._mockProviderResponses.get(providerId);
		if (!prefix) {
			return { success: false, error: `Unknown provider: ${providerId}`, errorCode: 'CRASH', data: prompt };
		}
		return adapterResultOk(`${prefix}${prompt}`);
	}

	private _delay(ms?: number): Promise<void> {
		const t = ms ?? this._mockDelayMs;
		return new Promise(resolve => setTimeout(resolve, t));
	}
}

import { IOminaiProvider, IOminaiProviderService, ITaskRole } from '../common/ominaiServices.js';

export class MockOminaiProviderService extends Disposable implements IOminaiProviderService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeActiveProvider = this._register(new Emitter<IOminaiProvider>());
	readonly onDidChangeActiveProvider: Event<IOminaiProvider> = this._onDidChangeActiveProvider.event;

	private providers: IOminaiProvider[] = [
		// Tier 1 - Must Support
		{ id: 'openai-gpt4', name: 'OpenAI ChatGPT', tier: 'top', description: 'GPT-4 and GPT-4o models', supportsVision: true, supportsTools: true },
		{ id: 'anthropic-claude3', name: 'Anthropic Claude', tier: 'top', description: 'Claude 3.5 Sonnet and Opus', supportsVision: true, supportsTools: true },
		{ id: 'google-gemini', name: 'Google Gemini', tier: 'top', description: 'Gemini 1.5 Pro and Flash', supportsVision: true, supportsTools: true },
		{ id: 'xai-grok', name: 'xAI Grok', tier: 'top', description: 'Grok-1.5 and Grok-2', supportsVision: false, supportsTools: true },
		{ id: 'microsoft-copilot', name: 'Microsoft Copilot', tier: 'top', description: 'Powered by GPT-4 and custom models', supportsVision: true, supportsTools: true },
		{ id: 'perplexity', name: 'Perplexity AI', tier: 'top', description: 'Web-grounded search models', supportsVision: false, supportsTools: false },
		{ id: 'mistral', name: 'Mistral AI', tier: 'top', description: 'Mistral Large and Le Chat', supportsVision: false, supportsTools: true },
		{ id: 'meta-llama3', name: 'Meta AI', tier: 'top', description: 'Llama 3 and Llama 3.1 405B', supportsVision: false, supportsTools: true },
		{ id: 'deepseek', name: 'DeepSeek', tier: 'top', description: 'DeepSeek Coder and Chat V2', supportsVision: false, supportsTools: true },
		{ id: 'moonshot-kimi', name: 'Moonshot Kimi', tier: 'top', description: 'Long-context reasoning', supportsVision: false, supportsTools: false },

		// Major Chinese AI
		{ id: 'qwen', name: 'Alibaba Qwen', tier: 'china', description: 'Tongyi Qianwen frontier models', supportsVision: true, supportsTools: true },
		{ id: 'doubao', name: 'Doubao (ByteDance)', tier: 'china', description: 'ByteDance foundational models', supportsVision: false, supportsTools: false },
		{ id: 'ernie', name: 'ERNIE Bot (Baidu)', tier: 'china', description: 'Baidu ERNIE 4.0', supportsVision: true, supportsTools: true },
		{ id: 'glm', name: 'Zhipu GLM', tier: 'china', description: 'GLM-4 and Z.ai', supportsVision: true, supportsTools: true },
		{ id: 'minimax', name: 'MiniMax', tier: 'china', description: 'MiniMax abab6.5', supportsVision: false, supportsTools: false },
		{ id: 'hunyuan', name: 'Tencent Hunyuan', tier: 'china', description: 'Tencent foundation model', supportsVision: false, supportsTools: false },
		{ id: 'sensenova', name: 'SenseNova', tier: 'china', description: 'SenseTime AI', supportsVision: false, supportsTools: false },
		{ id: 'spark', name: 'iFlytek Spark', tier: 'china', description: 'iFlytek cognitive model', supportsVision: false, supportsTools: false },
		{ id: '01ai', name: '01.AI (Yi)', tier: 'china', description: 'Yi-Large and Yi-Vision', supportsVision: true, supportsTools: true },

		// Coding Focused
		{ id: 'cursor', name: 'Cursor', tier: 'coding', description: 'AI Code Editor model backend', supportsVision: true, supportsTools: true },
		{ id: 'claude-code', name: 'Claude Code', tier: 'coding', description: 'Anthropic agentic CLI', supportsVision: false, supportsTools: true },
		{ id: 'aider', name: 'Aider', tier: 'coding', description: 'AI pair programming in terminal', supportsVision: false, supportsTools: true },
		{ id: 'opencode', name: 'OpenCode', tier: 'coding', description: 'Open source code generation', supportsVision: false, supportsTools: false },
		{ id: 'sourcegraph-cody', name: 'Sourcegraph Cody', tier: 'coding', description: 'Codebase-aware AI', supportsVision: false, supportsTools: true },
		{ id: 'codeium', name: 'Codeium (Windsurf)', tier: 'coding', description: 'Ultra-fast autocomplete and chat', supportsVision: false, supportsTools: true },

		// Aggregators
		{ id: 'openrouter', name: 'OpenRouter', tier: 'aggregator', description: 'Unified API for 100+ models', supportsVision: true, supportsTools: true },
		{ id: 'poe', name: 'Poe', tier: 'aggregator', description: 'Quora AI aggregator', supportsVision: true, supportsTools: false },
		{ id: 'librechat', name: 'LibreChat', tier: 'aggregator', description: 'Open source AI aggregator', supportsVision: true, supportsTools: true },

		// Local
		{ id: 'ollama', name: 'Ollama', tier: 'local', description: 'Run Llama, Mistral, Gemma locally', supportsVision: true, supportsTools: true },
		{ id: 'lmstudio', name: 'LM Studio', tier: 'local', description: 'Local LLM GUI', supportsVision: true, supportsTools: false },
		{ id: 'gpt4all', name: 'GPT4All', tier: 'local', description: 'Run local open-source models', supportsVision: false, supportsTools: false }
	];

	private activeProviderId: string = 'anthropic-claude3';

	// Task role assignments: roleId -> Set of assigned provider IDs
	private roleAssignments: Map<string, string[]> = new Map([
		['architecture', ['openai-gpt4', 'anthropic-claude3']],
		['coding', ['anthropic-claude3', 'deepseek']],
		['reasoning', ['anthropic-claude3', 'openai-gpt4']],
		['research', ['perplexity', 'google-gemini']],
		['debugging', ['anthropic-claude3', 'openai-gpt4']],
		['writing', ['anthropic-claude3']],
		['creative', ['openai-gpt4', 'meta-llama3']],
		['browser', ['google-gemini']],
		['vision', ['google-gemini', 'openai-gpt4']],
		['analysis', ['openai-gpt4', 'google-gemini']],
		['security', ['anthropic-claude3']],
		['performance', ['openai-gpt4']],
		['testing', ['anthropic-claude3', 'deepseek']],
		['documentation', ['anthropic-claude3']],
	]);

	// Primary provider per role (first assigned if not set)
	private rolePrimaryProvider: Map<string, string> = new Map([
		['architecture', 'openai-gpt4'],
		['coding', 'anthropic-claude3'],
		['reasoning', 'anthropic-claude3'],
		['research', 'perplexity'],
		['debugging', 'anthropic-claude3'],
		['writing', 'anthropic-claude3'],
		['creative', 'openai-gpt4'],
		['browser', 'google-gemini'],
		['vision', 'google-gemini'],
		['analysis', 'openai-gpt4'],
		['security', 'anthropic-claude3'],
		['performance', 'openai-gpt4'],
		['testing', 'anthropic-claude3'],
		['documentation', 'anthropic-claude3'],
	]);

	private readonly taskRoles: ITaskRole[] = [
		{ id: 'architecture', label: 'Architecture', icon: '🏗️', description: 'System design, planning, and high-level decisions', recommendedTiers: ['top'] },
		{ id: 'coding', label: 'Coding', icon: '💻', description: 'Writing, reviewing, and refactoring code', recommendedTiers: ['top', 'coding'] },
		{ id: 'reasoning', label: 'Reasoning', icon: '🧠', description: 'Complex logic, math, and multi-step thinking', recommendedTiers: ['top'] },
		{ id: 'research', label: 'Research', icon: '🔍', description: 'Web search, fact-finding, and information retrieval', recommendedTiers: ['top', 'research'] },
		{ id: 'debugging', label: 'Debugging', icon: '🐛', description: 'Trace errors, fix bugs, analyze stack traces', recommendedTiers: ['top', 'coding'] },
		{ id: 'writing', label: 'Writing', icon: '✍️', description: 'Documentation, README, blog posts, copy', recommendedTiers: ['top'] },
		{ id: 'creative', label: 'Creative', icon: '🎨', description: 'Ideation, storytelling, design thinking', recommendedTiers: ['top', 'creative'] },
		{ id: 'browser', label: 'Browser Use', icon: '🌐', description: 'Browser automation, web navigation, UI interaction', recommendedTiers: ['top'] },
		{ id: 'vision', label: 'Vision', icon: '👁️', description: 'Image understanding, screenshots, diagrams', recommendedTiers: ['top'] },
		{ id: 'analysis', label: 'Analysis', icon: '📊', description: 'Data analysis, charts, pattern recognition', recommendedTiers: ['top'] },
		{ id: 'security', label: 'Security', icon: '🔒', description: 'Security audits, vulnerability detection, hardening', recommendedTiers: ['top'] },
		{ id: 'performance', label: 'Performance', icon: '⚡', description: 'Profiling, optimization, bottleneck analysis', recommendedTiers: ['top', 'coding'] },
		{ id: 'testing', label: 'Testing', icon: '🧪', description: 'Unit tests, integration tests, test strategy', recommendedTiers: ['top', 'coding'] },
		{ id: 'documentation', label: 'Documentation', icon: '📚', description: 'API docs, inline comments, wikis', recommendedTiers: ['top'] },
	];

	private readonly _onDidChangeRoleAssignments = this._register(new Emitter<void>());
	readonly onDidChangeRoleAssignments = this._onDidChangeRoleAssignments.event;

	getProviders(): IOminaiProvider[] {
		return this.providers;
	}

	getActiveProvider(): IOminaiProvider | undefined {
		return this.providers.find(p => p.id === this.activeProviderId);
	}

	setActiveProvider(id: string): void {
		const provider = this.providers.find(p => p.id === id);
		if (provider && provider.id !== this.activeProviderId) {
			this.activeProviderId = provider.id;
			this._onDidChangeActiveProvider.fire(provider);
		}
	}

	getTaskRoles(): ITaskRole[] {
		return this.taskRoles;
	}

	getRoleAssignment(roleId: string): string[] {
		return this.roleAssignments.get(roleId) ?? [];
	}

	assignProviderToRole(roleId: string, providerId: string): void {
		const current = this.roleAssignments.get(roleId) ?? [];
		if (!current.includes(providerId)) {
			this.roleAssignments.set(roleId, [...current, providerId]);
			if (current.length === 0) {
				this.rolePrimaryProvider.set(roleId, providerId);
			}
			this._onDidChangeRoleAssignments.fire();
		}
	}

	removeProviderFromRole(roleId: string, providerId: string): void {
		const current = this.roleAssignments.get(roleId) ?? [];
		const updated = current.filter(id => id !== providerId);
		this.roleAssignments.set(roleId, updated);
		if (this.rolePrimaryProvider.get(roleId) === providerId) {
			this.rolePrimaryProvider.set(roleId, updated[0] ?? '');
		}
		this._onDidChangeRoleAssignments.fire();
	}

	setPrimaryProviderForRole(roleId: string, providerId: string): void {
		const assigned = this.roleAssignments.get(roleId) ?? [];
		if (!assigned.includes(providerId)) {
			this.assignProviderToRole(roleId, providerId);
		}
		this.rolePrimaryProvider.set(roleId, providerId);
		this._onDidChangeRoleAssignments.fire();
	}

	getPrimaryProviderForRole(roleId: string): IOminaiProvider | undefined {
		const primaryId = this.rolePrimaryProvider.get(roleId);
		if (!primaryId) return undefined;
		return this.providers.find(p => p.id === primaryId);
	}
}
