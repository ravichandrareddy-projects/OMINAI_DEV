/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../../workbench/common/contributions.js';
import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { IInstantiationService, ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { OMINIApiKeySettingsDialog } from './ominiApiKeySettings.js';
import { localize2 } from '../../../../nls.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';

/**
 * Workbench contribution that provides the API key configuration UI.
 *
 * Registers:
 * - `omini.configureApiKeys` command (F1) to open the settings dialog
 * - Manages the `OMINIApiKeySettingsDialog` lifecycle
 */
export class OMINIApiKeySettingsContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.ominiApiKeySettings';

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super();

		this._registerCommands();
	}

	private _registerCommands(): void {
		// Register command
		this._register(CommandsRegistry.registerCommand('omini.configureApiKeys', (accessor, ..._args) => {
			const dialog = this.instantiationService.createInstance(OMINIApiKeySettingsDialog);
			dialog.open();
		}));

		// Register F1 action
		this._register(registerAction2(class ConfigureApiKeysAction extends Action2 {
			constructor() {
				super({
					id: 'omini.configureApiKeys',
					title: localize2('omini.configureApiKeys.title', 'Configure API Providers'),
					category: Categories.View,
					f1: true,
				});
			}
			override async run(accessor: ServicesAccessor): Promise<void> {
				const dialog = accessor.get(IInstantiationService).createInstance(OMINIApiKeySettingsDialog);
				dialog.open();
			}
		}));
	}
}

registerWorkbenchContribution2(OMINIApiKeySettingsContribution.ID, OMINIApiKeySettingsContribution, WorkbenchPhase.BlockRestore);
