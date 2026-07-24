/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../workbench/common/contributions.js';
import { IContextKeyService } from '../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { OminaiWorkspaceOverlay } from './ominaiWorkspaceOverlay.js';
import { OMINI_MODE_CONTEXT_KEY, OMINIMode } from '../../sessions/contrib/omini/browser/ominiModeSwitcher.js';
import { CommandsRegistry } from '../../platform/commands/common/commands.js';
import { MenuRegistry, MenuId } from '../../platform/actions/common/actions.js';

import { registerSingleton, InstantiationType } from '../../platform/instantiation/common/extensions.js';
import { IOminaiSessionService, IOminaiExecutionService, IOminaiProjectService, IOminaiLoggerService, IOminaiBrowserService } from '../common/ominaiServices.js';
import { MockOminaiSessionService, MockOminaiExecutionService, MockOminaiProjectService, MockOminaiLoggerService, MockOminaiBrowserService } from './ominaiMockServices.js';

registerSingleton(IOminaiSessionService, MockOminaiSessionService, InstantiationType.Delayed);
registerSingleton(IOminaiExecutionService, MockOminaiExecutionService, InstantiationType.Delayed);
registerSingleton(IOminaiProjectService, MockOminaiProjectService, InstantiationType.Delayed);
registerSingleton(IOminaiLoggerService, MockOminaiLoggerService, InstantiationType.Delayed);
registerSingleton(IOminaiBrowserService, MockOminaiBrowserService, InstantiationType.Delayed);

export class OminaiWorkspaceContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.ominaiWorkspace';

	private overlay: OminaiWorkspaceOverlay | undefined;

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IContextKeyService private readonly contextKeyService: IContextKeyService,
	) {
		super();

		// ── Register the context key listener FIRST ──
		// This must happen BEFORE overlay creation so that mode switching always
		// triggers _syncOverlayState() even when overlay construction fails.
		// (safeCreateContribution catches and logs constructor errors silently,
		//  so an overlay failure would otherwise prevent the listener from ever
		//  being registered — the mode switcher would set the context key but
		//  nobody would be listening.)
		this._register(this.contextKeyService.onDidChangeContext(e => {
			if (e.affectsSome(new Set([OMINI_MODE_CONTEXT_KEY.key]))) {
				this._syncOverlayState();
			}
		}));

		// ── Create the overlay with error isolation ──
		// A failure in any single sub-component (DI resolution, constructor)
		// should not prevent the entire contribution from working.
		try {
			this.overlay = this.instantiationService.createInstance(OminaiWorkspaceOverlay);
			this._register(this.overlay);
			this.overlay.mount();
		} catch (error) {
			console.error('[OMINAI Workspace] Failed to create overlay — mode switching listener is still active.', error);
		}

		// Initial sync
		this._syncOverlayState();

		// Register Commands
		this._registerCommands();
	}

	private _syncOverlayState(): void {
		if (!this.overlay) {
			return; // overlay creation failed, nothing to show/hide
		}
		const currentMode = this.contextKeyService.getContextKeyValue<string>(OMINI_MODE_CONTEXT_KEY.key);
		if (currentMode === OMINIMode.OMINI) {
			this.overlay.show();
		} else {
			this.overlay.hide();
		}
	}

	private _registerCommands(): void {
		CommandsRegistry.registerCommand({
			id: 'ominai.workspace.open',
			handler: () => {
				OMINI_MODE_CONTEXT_KEY.bindTo(this.contextKeyService).set(OMINIMode.OMINI);
			}
		});

		MenuRegistry.appendMenuItem(MenuId.CommandPalette, {
			command: {
				id: 'ominai.workspace.open',
				title: 'OMINAI: Open Workspace',
				category: 'OMINAI'
			}
		});

		CommandsRegistry.registerCommand({
			id: 'ominai.session.new',
			handler: () => {
				// Future: Create new session logic
			}
		});

		MenuRegistry.appendMenuItem(MenuId.CommandPalette, {
			command: {
				id: 'ominai.session.new',
				title: 'OMINAI: New Session',
				category: 'OMINAI'
			}
		});
	}
}

registerWorkbenchContribution2(OminaiWorkspaceContribution.ID, OminaiWorkspaceContribution, WorkbenchPhase.AfterRestored);
