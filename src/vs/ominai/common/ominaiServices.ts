/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../platform/instantiation/common/instantiation.js';
import { Event } from '../../base/common/event.js';

// ── Session Service ──
export const IOminaiSessionService = createDecorator<IOminaiSessionService>('ominaiSessionService');

export interface IOminaiSession {
	readonly id: string;
	title: string;
	createdAt: number;
	lastAccessedAt: number;
}

export interface IOminaiSessionService {
	readonly _serviceBrand: undefined;

	readonly onDidChangeSessions: Event<void>;
	readonly onDidChangeActiveSession: Event<IOminaiSession | undefined>;

	getSessions(): readonly IOminaiSession[];
	getActiveSession(): IOminaiSession | undefined;

	createSession(): IOminaiSession;
	deleteSession(id: string): void;
	renameSession(id: string, newTitle: string): void;
	switchSession(id: string): void;
}

// ── Execution Service ──
export const IOminaiExecutionService = createDecorator<IOminaiExecutionService>('ominaiExecutionService');

export type ExecutionState = 'idle' | 'running' | 'completed' | 'error';

export interface IExecutionStep {
	readonly id: string;
	title: string;
	state: ExecutionState;
}

export interface IOminaiExecutionService {
	readonly _serviceBrand: undefined;

	readonly onDidChangeExecutionState: Event<void>;

	getSteps(): readonly IExecutionStep[];
	getCurrentState(): ExecutionState;
}

// ── Shared Backend Types (mirrors Python browser_adapter/base.py) ──

export type ErrorCode =
	| 'LOGIN_REQUIRED'
	| 'SELECTOR_STALE'
	| 'TIMEOUT'
	| 'EMPTY_RESPONSE'
	| 'FALSE_COMPLETE'
	| 'CRASH'
	| 'NOT_INITIALIZED';

/**
 * User-friendly display strings for each ErrorCode.
 * These are shown in the chat UI when a backend operation fails,
 * so the user understands what went wrong and what to do next.
 */
const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
	LOGIN_REQUIRED: 'Login required. Please sign in to the provider in the browser window.',
	SELECTOR_STALE: 'Site interface changed. The page layout has been updated — the adapter may need a selector update.',
	TIMEOUT: 'Request timed out. The provider took too long to respond.',
	EMPTY_RESPONSE: 'Empty response. The provider returned no output.',
	FALSE_COMPLETE: 'Generation appeared to finish but produced no output — likely a false completion.',
	CRASH: 'Unexpected error occurred. Please try again.',
	NOT_INITIALIZED: 'Backend not started. Please start the browser backend first.',
};

export function errorCodeToMessage(code: ErrorCode): string {
	return ERROR_CODE_MESSAGES[code] ?? 'Unknown error.';
}

/**
 * Uniform return type matching Python's AdapterResult dataclass.
 * The Main Agent never has to special-case a provider's raw exceptions
 * or return shapes — every backend call speaks IAdapterResult.
 */
export interface IAdapterResult {
	readonly success: boolean;
	readonly data?: string;
	readonly error?: string;
	readonly errorCode?: ErrorCode;
}

export function adapterResultOk(data?: string): IAdapterResult {
	return { success: true, data };
}

export function adapterResultFail(
	error: string,
	code: ErrorCode = 'CRASH',
	data?: string,
): IAdapterResult {
	return { success: false, error, errorCode: code, data };
}

// ── Browser Service (facade over Python browser-use backend) ──
export const IOminaiBrowserService = createDecorator<IOminaiBrowserService>('ominaiBrowserService');

export interface IOminaiBrowserService {
	readonly _serviceBrand: undefined;

	/** Fires when the backend starts or stops. */
	readonly onDidChangeBackendState: Event<void>;

	/** True while the backend is started and ready for prompts. */
	readonly isRunning: boolean;

	/** Bring the backend online (launches Chromium via browser-use). */
	startBackend(): Promise<IAdapterResult>;

	/** Shut the backend down cleanly (closes browser, flushes traces). */
	stopBackend(): Promise<IAdapterResult>;

	/**
	 * Execute one provider cycle: send prompt, wait, return response.
	 * @param providerId  Target provider, e.g. 'chatgpt' | 'claude' | 'gemini'
	 * @param prompt      The prompt text to send
	 */
	runSinglePrompt(providerId: string, prompt: string): Promise<IAdapterResult>;
}

// ── Project Service ──
export const IOminaiProjectService = createDecorator<IOminaiProjectService>('ominaiProjectService');

export interface IOminaiProjectService {
	readonly _serviceBrand: undefined;
	readonly onDidChangeProjectState: Event<void>;

	getProjectName(): string;
	getCurrentTask(): string;
	getProgress(): number;
}

// ── Logger Service ──
export const IOminaiLoggerService = createDecorator<IOminaiLoggerService>('ominaiLoggerService');

export interface IOminaiLoggerService {
	readonly _serviceBrand: undefined;

	trace(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string | Error, ...args: unknown[]): void;
}

// ── Provider Service (UI model config only; real engine built separately) ──
export const IOminaiProviderService = createDecorator<IOminaiProviderService>('ominaiProviderService');

export type ProviderTier = 'top' | 'china' | 'coding' | 'research' | 'aggregator' | 'local' | 'personal' | 'creative' | 'video' | 'audio';

export interface IOminaiProvider {
	id: string;
	name: string;
	tier: ProviderTier;
	description?: string;
	supportsVision?: boolean;
	supportsTools?: boolean;
}

export interface IOminaiProviderService {
	readonly _serviceBrand: undefined;

	readonly onDidChangeActiveProvider: Event<IOminaiProvider>;
	readonly onDidChangeRoleAssignments: Event<void>;

	getProviders(): IOminaiProvider[];
	getActiveProvider(): IOminaiProvider | undefined;
	setActiveProvider(id: string): void;

	// Task Role Assignment
	getTaskRoles(): ITaskRole[];
	getRoleAssignment(roleId: string): string[]; // returns assigned provider IDs
	assignProviderToRole(roleId: string, providerId: string): void;
	removeProviderFromRole(roleId: string, providerId: string): void;
	setPrimaryProviderForRole(roleId: string, providerId: string): void;
	getPrimaryProviderForRole(roleId: string): IOminaiProvider | undefined;
}

export type TaskRoleId =
	| 'architecture'
	| 'coding'
	| 'reasoning'
	| 'research'
	| 'debugging'
	| 'writing'
	| 'creative'
	| 'browser'
	| 'vision'
	| 'analysis'
	| 'security'
	| 'performance'
	| 'testing'
	| 'documentation';

export interface ITaskRole {
	id: TaskRoleId;
	label: string;
	icon: string;
	description: string;
	recommendedTiers: ProviderTier[];
}
