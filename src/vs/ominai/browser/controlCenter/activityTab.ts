/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append } from '../../../base/browser/dom.js';
import { IOminaiExecutionService } from '../../common/ominaiServices.js';

/**
 * A single step in the execution timeline.
 * Not chat history — each entry is a concrete action OMINAI took.
 */
export interface IActivityStep {
	readonly id: string;
	label: string;
	state: 'pending' | 'running' | 'completed' | 'failed';
	timestamp?: string; // optional relative time, e.g. "2s ago"
}

export interface IActivityData {
	steps: IActivityStep[];
}

const MOCK_TIMELINE: IActivityStep[] = [
	{ id: 'plan', label: 'Planning Project', state: 'completed', timestamp: '2m ago' },
	{ id: 'read', label: 'Reading Files', state: 'completed', timestamp: '1m ago' },
	{ id: 'browser', label: 'Opening Browser', state: 'running', timestamp: '30s ago' },
	{ id: 'search', label: 'Searching Provider', state: 'pending' },
	{ id: 'response', label: 'Receiving Response', state: 'pending' },
	{ id: 'update', label: 'Updating Files', state: 'pending' },
	{ id: 'cmd', label: 'Running Commands', state: 'pending' },
	{ id: 'verify', label: 'Verifying Build', state: 'pending' },
	{ id: 'done', label: 'Completed', state: 'pending' },
];

/**
 * ActivityTab — the execution timeline.
 *
 * Shows a chronological list of steps with color-coded indicators.
 * Never renders giant logs — only concise summaries per step.
 */
export class ActivityTab extends Disposable {
	private readonly body: HTMLElement;
	private readonly listEl: HTMLElement;
	private currentSteps: IActivityStep[];
	private readonly stepElements: Map<string, HTMLElement> = new Map();

	constructor(
		private readonly container: HTMLElement,
		data: IActivityData = { steps: MOCK_TIMELINE },
		@IOminaiExecutionService private readonly executionService: IOminaiExecutionService,
	) {
		super();
		this.currentSteps = [...data.steps];
		this.container.classList.add('ominai-activity-tab');

		this.body = append(this.container, $('div.ominai-panel-body'));
		this.listEl = append(this.body, $('div.ominai-activity-timeline'));

		this._buildSteps(this.currentSteps);

		// Refresh on execution state changes
		this._register(this.executionService.onDidChangeExecutionState(() => this._refreshFromService()));
	}

	/**
	 * Pull the latest execution steps from the service and push them
	 * into the timeline view.
	 */
	private _refreshFromService(): void {
		const steps = this.executionService.getSteps().map(s => ({
			id: s.id,
			label: s.title,
			state: s.state === 'idle' ? 'pending' as const
				: s.state === 'running' ? 'running' as const
				: s.state === 'completed' ? 'completed' as const
				: 'failed' as const,
		}));
		this.update({ steps });
	}

	public update(data: IActivityData): void {
		const newSteps = data.steps;
		const oldSteps = this.currentSteps;
		const oldIds = new Set(oldSteps.map(s => s.id));
		const newIds = new Set(newSteps.map(s => s.id));

		// Remove deleted steps from DOM and map
		for (const id of oldIds) {
			if (!newIds.has(id)) {
				const el = this.stepElements.get(id);
				if (el) {
					el.remove();
					this.stepElements.delete(id);
				}
			}
		}

		// Build a map of old steps for state comparison
		const oldStepMap = new Map(oldSteps.map(s => [s.id, s]));

		// Add or update steps, preserving insertion order
		for (const step of newSteps) {
			const existingEl = this.stepElements.get(step.id);
			if (existingEl) {
				// Targeted update: only change what's different
				if (step.state !== oldStepMap.get(step.id)?.state) {
					existingEl.dataset.state = step.state;
					const dot = existingEl.querySelector('.ominai-activity-dot') as HTMLElement;
					if (dot) {
						dot.className = 'ominai-activity-dot';
						this._applyStateClass(dot, step.state);
					}
				}
				const timeEl = existingEl.querySelector('.ominai-activity-time');
				if (timeEl && step.timestamp) {
					timeEl.textContent = step.timestamp;
				}
			} else {
				// New step — build element and insert at correct position
				const row = this._buildStepElement(step);
				this.stepElements.set(step.id, row);
				// Insert before the next known element, or append
				const nextId = this._findNextId(step.id, newSteps);
				const nextEl = nextId ? this.stepElements.get(nextId) : undefined;
				if (nextEl && nextEl.parentElement) {
					this.listEl.insertBefore(row, nextEl);
				} else {
					this.listEl.appendChild(row);
				}
			}
		}

		this.currentSteps = [...newSteps];
	}

	private _findNextId(currentId: string, steps: IActivityStep[]): string | undefined {
		const idx = steps.findIndex(s => s.id === currentId);
		if (idx >= 0 && idx < steps.length - 1) {
			return steps[idx + 1].id;
		}
		return undefined;
	}

	private _buildStepElement(step: IActivityStep): HTMLElement {
		const row = $('div.ominai-activity-step');
		row.dataset.stepId = step.id;
		row.dataset.state = step.state;

		// Indicator dot
		const dot = append(row, $('span.ominai-activity-dot'));
		this._applyStateClass(dot, step.state);

		// Animated spinner for running steps
		if (step.state === 'running') {
			const spinner = append(row, $('span.codicon.codicon-loading.ominai-spin'));
			spinner.style.marginRight = '6px';
		}

		// Label
		const label = append(row, $('span.ominai-activity-label'));
		label.textContent = step.label;

		// Timestamp
		if (step.timestamp) {
			const time = append(row, $('span.ominai-activity-time'));
			time.textContent = step.timestamp;
		}

		return row;
	}

	private _buildSteps(steps: IActivityStep[]): void {
		for (const step of steps) {
			const row = this._buildStepElement(step);
			this.stepElements.set(step.id, row);
			this.listEl.appendChild(row);
		}
	}

	private _applyStateClass(el: HTMLElement, state: string): void {
		switch (state) {
			case 'pending':
				el.classList.add('ominai-activity-pending');
				break;
			case 'running':
				el.classList.add('ominai-activity-running');
				break;
			case 'completed':
				el.classList.add('ominai-activity-completed');
				break;
			case 'failed':
				el.classList.add('ominai-activity-failed');
				break;
		}
	}
}
