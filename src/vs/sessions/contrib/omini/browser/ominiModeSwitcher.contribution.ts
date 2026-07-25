/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominiModeSwitcher.css';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../../workbench/common/contributions.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
import { IContextKeyService, IContextKey } from '../../../../platform/contextkey/common/contextkey.js';
import { CommandsRegistry, ICommandService } from '../../../../platform/commands/common/commands.js';
import { localize, localize2 } from '../../../../nls.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { KeyMod, KeyCode } from '../../../../base/common/keyCodes.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { OMINIMode, OMINI_MODE_DEFINITIONS, OMINI_MODE_CONTEXT_KEY, OMINIModeSwitcherWidget, onDidChangeOMINIMode } from './ominiModeSwitcher.js';

import { MenuRegistry, MenuId } from '../../../../platform/actions/common/actions.js';
import { IActionViewItemService } from '../../../../platform/actions/browser/actionViewItemService.js';
import { BaseActionViewItem } from '../../../../base/browser/ui/actionbar/actionViewItems.js';
import { IAction } from '../../../../base/common/actions.js';

class OMINIModeSwitcherActionViewItem extends BaseActionViewItem {
	private _switcherWidget?: OMINIModeSwitcherWidget;

	constructor(
		action: IAction,
		private readonly _modeContextKey: IContextKey<OMINIMode>,
		private readonly _layoutService: ILayoutService,
	) {
		super(null, action);
	}

	override render(container: HTMLElement): void {
		super.render(container);
		
		this._switcherWidget = new OMINIModeSwitcherWidget(
			this._modeContextKey.get() ?? OMINIMode.Code,
			this._layoutService.mainContainer
		);
		this._register(this._switcherWidget);
		
		this._register(this._switcherWidget.onDidSelectMode(mode => {
			this._modeContextKey.set(mode);
			onDidChangeOMINIMode.fire(mode);
		}));

		// Natively append our widget to the container provided by the toolbar layout
		container.appendChild(this._switcherWidget.element);
		container.classList.add('omini-mode-switcher-container');
	}
}

/**
 * Workbench contribution that adds the OMINI mode switcher UI to the
 * sessions window title bar natively via the Command Center menu.
 */
export class OMINIModeSwitcherContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.ominiModeSwitcher';

	private _modeContextKey: IContextKey<OMINIMode>;

	constructor(
		@ILayoutService private readonly layoutService: ILayoutService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IActionViewItemService actionViewItemService: IActionViewItemService,
	) {
		super();

		// Bind the mode context key (default: Code mode)
		this._modeContextKey = OMINI_MODE_CONTEXT_KEY.bindTo(contextKeyService);
		this._modeContextKey.set(OMINIMode.Code);

		// Register native ActionViewItem FIRST so the toolbar finds it when the menu updates
		this._registerActionViewItem(actionViewItemService);

		// Register mode switch commands and append the menu item SECOND
		this._registerCommands();
	}

	private _registerCommands(): void {
		const self = this;
		for (const def of OMINI_MODE_DEFINITIONS) {
			const modePascal = def.mode.charAt(0).toUpperCase() + def.mode.slice(1);
			const commandId = `omini.switchTo${modePascal}Mode`;
			const isOMINI = def.mode === OMINIMode.OMINI;

			this._register(registerAction2(class SwitchModeAction extends Action2 {
				constructor() {
					super({
						id: commandId,
						title: localize2('omini.switchMode.title', 'Switch to {0} Mode', def.label),
						category: Categories.View,
						keybinding: isOMINI ? {
							primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyO,
							weight: KeybindingWeight.WorkbenchContrib + 50,
						} : undefined,
						f1: true,
					});
				}
				override async run(_accessor: ServicesAccessor): Promise<void> {
					self._modeContextKey.set(def.mode);
				}
			}));
		}

		// Register the dummy action that holds our switcher in the menu
		const SWITCHER_COMMAND_ID = 'workbench.action.ominiModeSwitcherWidget';
		CommandsRegistry.registerCommand(SWITCHER_COMMAND_ID, () => {});
		
		MenuRegistry.appendMenuItem(MenuId.CommandCenter, {
			command: {
				id: SWITCHER_COMMAND_ID,
				title: localize('omini.modeSwitcher', 'OMINI Mode Switcher'),
			},
			group: 'navigation', // The standard command center navigation group
			order: 1000 // Place it at the far right
		});
	}

	private _registerActionViewItem(actionViewItemService: IActionViewItemService): void {
		this._register(actionViewItemService.register(
			MenuId.CommandCenter,
			'workbench.action.ominiModeSwitcherWidget',
			(action) => new OMINIModeSwitcherActionViewItem(
				action,
				this._modeContextKey,
				this.layoutService,

			)
		));
	}
}

registerWorkbenchContribution2(OMINIModeSwitcherContribution.ID, OMINIModeSwitcherContribution, WorkbenchPhase.BlockRestore);
