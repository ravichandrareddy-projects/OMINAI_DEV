/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { IOminaiExecutionService, IExecutionStep } from '../../common/ominaiServices.js';

export class ExecutionPanel extends Disposable {
	private readonly container: HTMLElement;
	private readonly header: HTMLElement;
	private readonly content: HTMLElement;
	private readonly stepContainer: HTMLElement;
	private isExpanded = false;

	constructor(
		parent: HTMLElement,
		@IOminaiExecutionService private readonly executionService: IOminaiExecutionService
	) {
		super();
		this.container = append(parent, $('div.ominai-execution-panel'));
		
		this.header = append(this.container, $('div.ominai-execution-header'));
		this.header.tabIndex = 0;
		this.header.setAttribute('role', 'button');
		this.header.setAttribute('aria-expanded', 'false');
		this.header.setAttribute('aria-label', 'Toggle internal execution details');
		
		append(this.header, $('span.codicon.codicon-chevron-right'));
		append(this.header, $('span')).textContent = 'Internal Execution';

		this.content = append(this.container, $('div.ominai-execution-content'));
		this.stepContainer = append(this.content, $('div.ominai-execution-steps'));

		this._register(addDisposableListener(this.header, EventType.CLICK, () => this.toggle()));
		this._register(addDisposableListener(this.header, EventType.KEY_DOWN, (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				this.toggle();
			}
		}));

		this._register(this.executionService.onDidChangeExecutionState(() => this._renderSteps()));
		this._renderSteps();
	}

	private toggle(): void {
		this.isExpanded = !this.isExpanded;
		this.header.setAttribute('aria-expanded', String(this.isExpanded));
		if (this.isExpanded) {
			this.container.classList.add('expanded');
			this.header.querySelector('.codicon')?.classList.replace('codicon-chevron-right', 'codicon-chevron-down');
		} else {
			this.container.classList.remove('expanded');
			this.header.querySelector('.codicon')?.classList.replace('codicon-chevron-down', 'codicon-chevron-right');
		}
	}

	private _renderSteps(): void {
		this.stepContainer.textContent = ''; // clear
		const steps = this.executionService.getSteps();
		for (const step of steps) {
			this._renderStep(step);
		}
	}

	private _renderStep(step: IExecutionStep): void {
		const stepEl = append(this.stepContainer, $('div.ominai-execution-step'));
		if (step.state === 'completed') {
			stepEl.classList.add('completed');
			append(stepEl, $('span.codicon.codicon-check'));
		} else if (step.state === 'running') {
			stepEl.classList.add('running');
			append(stepEl, $('span.codicon.codicon-loading'));
		} else {
			append(stepEl, $('span.codicon.codicon-circle'));
		}
		append(stepEl, $('span')).textContent = step.title;
	}
}
