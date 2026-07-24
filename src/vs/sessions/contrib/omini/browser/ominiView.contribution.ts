/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominiView.css';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../../workbench/common/contributions.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { OMINIView } from './ominiView.js';
import { OMINIMode, OMINI_MODE_CONTEXT_KEY } from './ominiModeSwitcher.js';

/**
 * Workbench contribution that manages the OMINI mode orchestration view.
 *
 * Creates the view widget and inserts it into the sessions content area.
 * In Phase 1 the view is toggled via the `omini.showOMINIView` command.
 * In later phases it will automatically show/hide based on the active mode.
 */
export class OMINIViewContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.ominiView';

	private readonly _view: OMINIView;

	constructor(
		@ILayoutService private readonly layoutService: ILayoutService,
		@IContextKeyService contextKeyService: IContextKeyService,
	) {
		super();

		OMINI_MODE_CONTEXT_KEY.bindTo(contextKeyService);

		// Create the view widget (initially detached)
		this._view = this._register(new OMINIView());
		this._view.element.style.display = 'none';

		// Register commands
		this._registerCommands();

		// Insert into the DOM when ready
		this._insertView();
	}

	private _registerCommands(): void {
		this._register(CommandsRegistry.registerCommand('omini.showOMINIView', (_accessor, show?: boolean) => {
			if (show !== undefined) {
				this._setVisible(show);
			} else {
				this._setVisible(this._view.element.style.display === 'none');
			}
		}));
	}

	private _insertView(): void {
		const container = this.layoutService.mainContainer;

		if (container.querySelector('.omini-view')) {
			return;
		}

		// Try to insert after the title bar / header area
		const titleBar = container.querySelector('.part.titlebar');
		if (titleBar && titleBar.nextElementSibling) {
			titleBar.parentElement?.insertBefore(this._view.element, titleBar.nextElementSibling);
		} else {
			// Fallback: insert at top of main container
			container.insertBefore(this._view.element, container.firstChild);
		}
	}

	private _setVisible(visible: boolean): void {
		this._view.element.style.display = visible ? '' : 'none';
	}
}

registerWorkbenchContribution2(OMINIViewContribution.ID, OMINIViewContribution, WorkbenchPhase.BlockRestore);
