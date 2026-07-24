/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominiStatusIndicator.css';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../../workbench/common/contributions.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { OMINIStatusIndicator } from './ominiStatusIndicator.js';
import { localize } from '../../../../nls.js';

/**
 * Workbench contribution that manages the OMINI "cooking" status indicator.
 *
 * Creates the indicator widget (initially hidden) and registers F1 commands
 * for testing the cooking animation in Phase 1. In later phases this will
 * be driven by the agent execution pipeline.
 */
export class OMINIStatusIndicatorContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.ominiStatusIndicator';

	private readonly _indicator: OMINIStatusIndicator;
	private _demoTimer: any | undefined;
	private _demoStepIndex = 0;

	constructor(
		@ILayoutService private readonly layoutService: ILayoutService,
	) {
		super();

		// Create the status indicator widget
		this._indicator = this._register(new OMINIStatusIndicator());

		// Register test commands
		this._registerCommands();

		// Insert into the DOM when ready
		this._insertIndicator();
	}

	private _registerCommands(): void {
		// Start cooking demo
		this._register(CommandsRegistry.registerCommand('omini.startCooking', (_accessor, ..._args) => {
			this._startDemo();
		}));

		// Stop cooking
		this._register(CommandsRegistry.registerCommand('omini.stopCooking', (_accessor, ..._args) => {
			this._stopDemo();
		}));
	}

	private _insertIndicator(): void {
		const container = this.layoutService.mainContainer;

		// Avoid duplicates
		if (container.querySelector('.omini-status-indicator')) {
			return;
		}

		// Try to find the sessions view content area, or fall back to main container
		const target = container.querySelector('.chat-view-new') ?? container.querySelector('.sessions-view') ?? container;

		if (target !== container) {
			// Insert at the top of the chat view
			target.insertAdjacentElement('afterbegin', this._indicator.element);
		} else {
			// Fallback: wait for layout
			this._register(this.layoutService.onDidLayoutMainContainer(() => {
				const t = container.querySelector('.chat-view-new') ?? container.querySelector('.sessions-view') ?? container;
				if (t !== container && !t.querySelector('.omini-status-indicator')) {
					t.insertAdjacentElement('afterbegin', this._indicator.element);
				} else if (!container.querySelector('.omini-status-indicator')) {
					container.appendChild(this._indicator.element);
				}
			}));
		}
	}

	// ── Demo methods for Phase 1 testing ──

	private _startDemo(): void {
		this._demoStepIndex = 0;
		this._clearTimer();

		const demoSteps = [
			{ id: 'step1', message: localize('omini.demo.analyzing', "Analyzing codebase…") },
			{ id: 'step2', message: localize('omini.demo.searching', "Searching for relevant files…") },
			{ id: 'step3', message: localize('omini.demo.reading', "Reading file contents…") },
			{ id: 'step4', message: localize('omini.demo.planning', "Planning changes…") },
			{ id: 'step5', message: localize('omini.demo.applying', "Applying changes…") },
			{ id: 'step6', message: localize('omini.demo.verifying', "Verifying results…") },
		] as const;

		this._indicator.startCooking(demoSteps.map(s => ({ ...s, status: 'pending' as const })));
		this._indicator.setMessage(demoSteps[0].message);

		// Activate steps one by one with a timer
		this._advanceDemo();
	}

	private _advanceDemo(): void {
		const steps = this._indicator.steps;
		if (this._demoStepIndex >= steps.length) {
			this._finishDemo();
			return;
		}

		// Activate current step
		const currentStep = steps[this._demoStepIndex];
		this._indicator.activateStep(currentStep.id);
		this._indicator.completeStep(currentStep.id);

		this._demoStepIndex++;

		if (this._demoStepIndex < steps.length) {
			// Set the next message as the shimmer text
			this._indicator.setMessage(steps[this._demoStepIndex].message);
			this._demoTimer = setTimeout(() => this._advanceDemo(), 1500);
		} else {
			// Give the last step a moment to show before finishing
			this._demoTimer = setTimeout(() => this._finishDemo(), 1000);
		}
	}

	private _finishDemo(): void {
		this._clearTimer();
		this._indicator.setMessage(localize('omini.demo.cooked', "All tasks complete!"));
		this._indicator.finishCooking();

		// Auto-hide after 3 seconds
		this._demoTimer = setTimeout(() => {
			this._indicator.hide();
		}, 3000);
	}

	private _stopDemo(): void {
		this._clearTimer();
		this._indicator.hide();
	}

	private _clearTimer(): void {
		if (this._demoTimer !== undefined) {
			clearTimeout(this._demoTimer);
			this._demoTimer = undefined;
		}
	}
}

registerWorkbenchContribution2(OMINIStatusIndicatorContribution.ID, OMINIStatusIndicatorContribution, WorkbenchPhase.BlockRestore);
