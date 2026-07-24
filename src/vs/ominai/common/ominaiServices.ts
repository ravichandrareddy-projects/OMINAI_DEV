/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../platform/instantiation/common/instantiation.js';
import { Event } from '../../base/common/event.js';

// --- Session Service ---
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

// --- Execution Service ---
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

// --- Browser Service (Extension Point) ---
export const IOminaiBrowserService = createDecorator<IOminaiBrowserService>('ominaiBrowserService');

export interface IOminaiBrowserService {
	readonly _serviceBrand: undefined;
	// Future extension point for browser automation
}

// --- Project Service ---
export const IOminaiProjectService = createDecorator<IOminaiProjectService>('ominaiProjectService');

export interface IOminaiProjectService {
	readonly _serviceBrand: undefined;
	readonly onDidChangeProjectState: Event<void>;
	
	getProjectName(): string;
	getCurrentTask(): string;
	getProgress(): number;
}

// --- Logger Service ---
export const IOminaiLoggerService = createDecorator<IOminaiLoggerService>('ominaiLoggerService');

export interface IOminaiLoggerService {
	readonly _serviceBrand: undefined;
	
	trace(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string | Error, ...args: unknown[]): void;
}
