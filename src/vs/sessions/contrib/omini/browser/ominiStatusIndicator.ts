/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, append, clearNode } from '../../../../base/browser/dom.js';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';

/**
 * State of a single progress step in the cooking animation.
 */
export interface IStatusStep {
	/** Unique identifier for this step */
	readonly id: string;
	/** Human-readable message describing the step */
	message: string;
	/** Current state */
	status: 'pending' | 'active' | 'completed' | 'error';
}

/**
 * Overall state of the cooking status indicator.
 */
export const enum OMINIStatusState {
	/** Not visible, no cooking happening */
	Idle = 'idle',
	/** Agent is actively processing — shimmer animation plays */
	Cooking = 'cooking',
	/** Cooking completed — settled state shown briefly before returning to idle */
	Done = 'done',
}

/**
 * Fired when the cooking indicator's state changes.
 */
export interface IOMINIStatusChangeEvent {
	readonly state: OMINIStatusState;
	/** Total steps when cooking started */
	readonly totalSteps?: number;
	/** Steps completed so far (only set for Cooking state) */
	readonly completedSteps?: number;
}

/**
 * A self-contained cooking/progress indicator widget.
 *
 * States:
 * - `Idle`   — invisible
 * - `Cooking` — visible with shimmer animation on the active step
 * - `Done`   — visible in a settled "Cooked!" state
 *
 * The widget creates its own DOM (`.omini-status-indicator`).
 * The caller is responsible for DOM insertion.
 */
export class OMINIStatusIndicator extends Disposable {

	private readonly _onDidStateChange = this._register(new Emitter<IOMINIStatusChangeEvent>());
	readonly onDidStateChange = this._onDidStateChange.event;

	private _state: OMINIStatusState = OMINIStatusState.Idle;
	private _steps: IStatusStep[] = [];

	/** Root DOM element — insert this into the document. */
	readonly element: HTMLElement;

	private readonly _iconEl: HTMLElement;
	private readonly _titleEl: HTMLElement;
	private readonly _messageEl: HTMLElement;
	private readonly _stepListEl: HTMLElement;
	private readonly _doneEl: HTMLElement;

	constructor() {
		super();

		this.element = $('.omini-status-indicator');

		// ── Header: emoji + title ──
		const header = append(this.element, $('.omini-status-header'));
		this._iconEl = append(header, $('.omini-status-icon'));
		this._iconEl.textContent = '🍳';
		this._titleEl = append(header, $('.omini-status-title'));
		this._titleEl.textContent = localize('omini.status.cooking', "Cooking…");

		// ── Current step message ──
		this._messageEl = append(this.element, $('.omini-status-message.shimmer-progress'));

		// ── Step list ──
		this._stepListEl = append(this.element, $('.omini-status-steps'));

		// ── Done overlay ──
		this._doneEl = append(this.element, $('.omini-status-done'));
		this._doneEl.textContent = '✅ ' + localize('omini.status.cooked', "Cooked!");
		this._doneEl.style.display = 'none';

		// Start hidden
		this.element.style.display = 'none';
	}

	get state(): OMINIStatusState {
		return this._state;
	}

	get steps(): ReadonlyArray<IStatusStep> {
		return this._steps;
	}

	/**
	 * Start cooking — show the indicator and begin the shimmer animation.
	 * Optionally provide an initial set of steps.
	 */
	startCooking(steps: IStatusStep[] = []): void {
		this._steps = steps;
		this._state = OMINIStatusState.Cooking;
		this._render();
		this.element.style.display = '';
		this._onDidStateChange.fire({ state: this._state, totalSteps: steps.length, completedSteps: 0 });
	}

	/**
	 * Mark cooking as complete — show the "Cooked!" settled state.
	 * The caller should call {@link hide} after a delay.
	 */
	finishCooking(): void {
		// Mark any active/pending steps as completed
		for (const step of this._steps) {
			if (step.status === 'active' || step.status === 'pending') {
				step.status = 'completed';
			}
		}
		this._state = OMINIStatusState.Done;
		this._render();
		this._onDidStateChange.fire({ state: this._state, totalSteps: this._steps.length, completedSteps: this._steps.length });
	}

	/**
	 * Hide the indicator entirely (Idle state).
	 */
	hide(): void {
		this._state = OMINIStatusState.Idle;
		this.element.style.display = 'none';
		this._onDidStateChange.fire({ state: this._state });
	}

	// ── Step manipulation ──

	/** Replace all steps. */
	setSteps(steps: IStatusStep[]): void {
		this._steps = [...steps];
		if (this._state === OMINIStatusState.Cooking) {
			this._render();
		}
	}

	/** Add a single step (appended after existing ones, as pending). */
	addStep(id: string, message: string): void {
		this._steps.push({ id, message, status: 'pending' });
		if (this._state === OMINIStatusState.Cooking) {
			this._render();
		}
	}

	/** Mark a step as active (shimmering). Any previously active step becomes completed. */
	activateStep(id: string): boolean {
		let found = false;
		for (const step of this._steps) {
			if (step.status === 'active') {
				step.status = 'completed';
			} else if (step.id === id) {
				step.status = 'active';
				found = true;
			}
		}
		if (this._state === OMINIStatusState.Cooking && found) {
			this._render();
		}
		return found;
	}

	/** Mark a step as completed (visual checkmark). */
	completeStep(id: string): boolean {
		const step = this._steps.find(s => s.id === id);
		if (step) {
			step.status = 'completed';
			if (this._state === OMINIStatusState.Cooking) {
				this._render();
			}
			return true;
		}
		return false;
	}

	/** Mark a step as errored. */
	errorStep(id: string): boolean {
		const step = this._steps.find(s => s.id === id);
		if (step) {
			step.status = 'error';
			if (this._state === OMINIStatusState.Cooking) {
				this._render();
			}
			return true;
		}
		return false;
	}

	/** Update the current shimmer message text (what shows above the step list). */
	setMessage(text: string): void {
		this._messageEl.textContent = text;
	}

	// ── Rendering ──

	private _render(): void {
		// Show/hide appropriate sections
		const isCooking = this._state === OMINIStatusState.Cooking;
		const isDone = this._state === OMINIStatusState.Done;

		this._iconEl.textContent = isDone ? '✅' : '🍳';
		this._titleEl.textContent = isDone
			? localize('omini.status.cooked', "Cooked!")
			: localize('omini.status.cooking', "Cooking…");

		this._messageEl.style.display = isCooking ? '' : 'none';
		this._stepListEl.style.display = isCooking ? '' : 'none';
		this._doneEl.style.display = isDone ? '' : 'none';

		if (isCooking) {
			// Build step list
			clearNode(this._stepListEl);
			for (const step of this._steps) {
				const row = append(this._stepListEl, $('.omini-status-step'));
				const icon = append(row, $('.omini-status-step-icon'));
				const label = append(row, $('.omini-status-step-label'));

				switch (step.status) {
					case 'active':
						icon.textContent = '🍳';
						label.textContent = step.message;
						label.classList.add('shimmer-progress');
						row.classList.add('active');
						break;
					case 'completed':
						icon.textContent = '✓';
						label.textContent = step.message;
						label.classList.remove('shimmer-progress');
						row.classList.add('completed');
						break;
					case 'error':
						icon.textContent = '✕';
						label.textContent = step.message;
						label.classList.remove('shimmer-progress');
						row.classList.add('error');
						break;
					default: // pending
						icon.textContent = '○';
						label.textContent = step.message;
						label.classList.remove('shimmer-progress');
						row.classList.add('pending');
						break;
				}
			}
		}
	}
}
