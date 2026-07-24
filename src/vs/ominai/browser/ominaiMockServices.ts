/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../base/common/event.js';
import { generateUuid } from '../../base/common/uuid.js';
import { IOminaiSession, IOminaiSessionService, IOminaiExecutionService, ExecutionState, IExecutionStep, IOminaiProjectService, IOminaiLoggerService, IOminaiBrowserService } from '../common/ominaiServices.js';
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

export class MockOminaiBrowserService implements IOminaiBrowserService {
	declare readonly _serviceBrand: undefined;
}
