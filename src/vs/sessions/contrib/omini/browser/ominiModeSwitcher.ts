/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, addDisposableListener, append, EventType, isAncestor, getWindow } from '../../../../base/browser/dom.js';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { OMINIMode, OMINI_MODE_CONTEXT_KEY, onDidChangeOMINIMode, IOMINIModeDefinition } from '../../../../ominai/common/ominiMode.js';
// Re-export for backwards compat — code importing from sessions layer still works
export { OMINIMode, OMINI_MODE_CONTEXT_KEY, onDidChangeOMINIMode };

const ominaiIcon = registerIcon('ominai-logo', Codicon.activateBreakpoints, 'OMINAI Logo');

export const OMINI_MODE_DEFINITIONS: IOMINIModeDefinition[] = [
	{ mode: OMINIMode.Code, label: 'Coding Mode', description: localize('omini.mode.code.desc', 'Standard VS Code experience') },
	{ mode: OMINIMode.OMINI, label: 'OMINAI Mode', description: localize('omini.mode.omini.desc', 'Active AI software engineer') },
	{ mode: OMINIMode.Agent, label: 'Agentic Mode', description: localize('omini.mode.agent.desc', 'Agentic automation'), badge: 'Coming Soon' },
];

export class OMINIModeSwitcherWidget extends Disposable {

	private readonly _onDidSelectMode = this._register(new Emitter<OMINIMode>());
	readonly onDidSelectMode = this._onDidSelectMode.event;

	private _currentMode: OMINIMode;
	private _isOpen = false;
	private readonly _container: HTMLElement;

	readonly element: HTMLElement;
	private readonly triggerLabel: HTMLElement;
	private readonly dropdownMenu: HTMLElement;
	private readonly _options = new Map<OMINIMode, HTMLElement>();

	constructor(initialMode: OMINIMode, container: HTMLElement) {
		super();
		this._currentMode = initialMode;
		this._container = container;

		this.element = $('div.omini-mode-switcher');

		const triggerBtn = append(this.element, $('button.omini-mode-trigger'));
		const iconSpan = append(triggerBtn, $(`span${ThemeIcon.asCSSSelector(ominaiIcon)}`));
		iconSpan.classList.add('omini-trigger-icon');

		this.triggerLabel = append(triggerBtn, $('span.omini-mode-label'));

		const chevronSpan = append(triggerBtn, $(`span${ThemeIcon.asCSSSelector(Codicon.chevronDown)}`));
		chevronSpan.classList.add('omini-trigger-chevron');

		this.dropdownMenu = append(this._container, $('div.omini-mode-dropdown'));

		for (const def of OMINI_MODE_DEFINITIONS) {
			const optionBtn = append(this.dropdownMenu, $('button.omini-mode-option'));
			optionBtn.setAttribute('data-mode', def.mode);
			optionBtn.title = def.description;

			if (def.mode === OMINIMode.OMINI) {
				append(optionBtn, $('span.omini-option-dot'));
			}

			const labelSpan = append(optionBtn, $('span.omini-option-label'));
			labelSpan.textContent = def.label;

			if (def.badge) {
				const badgeSpan = append(optionBtn, $('span.omini-option-badge'));
				badgeSpan.textContent = def.badge;
			}

			this._register(addDisposableListener(optionBtn, EventType.CLICK, (e) => {
				e.stopPropagation();
				this.setMode(def.mode);
				this._onDidSelectMode.fire(def.mode);
				this.closeDropdown();
			}));

			this._options.set(def.mode, optionBtn);
		}

		this._register(addDisposableListener(triggerBtn, EventType.CLICK, (e) => {
			e.stopPropagation();
			this.toggleDropdown();
		}));

		this._register(addDisposableListener(getWindow(this.element), EventType.CLICK, (e) => {
			if (this._isOpen && !isAncestor(e.target as Node, this.element) && !isAncestor(e.target as Node, this.dropdownMenu)) {
				this.closeDropdown();
			}
		}));

		this.updateUI();
	}

	get currentMode(): OMINIMode {
		return this._currentMode;
	}

	setMode(mode: OMINIMode): void {
		if (this._currentMode !== mode) {
			this._currentMode = mode;
			this.updateUI();
		}
	}

	private toggleDropdown(): void {
		if (this._isOpen) {
			this.closeDropdown();
		} else {
			this.openDropdown();
		}
	}

	private openDropdown(): void {
		this._isOpen = true;
		this.element.classList.add('open');

		// Calculate position explicitly since we appended it to the workbench
		const rect = this.element.getBoundingClientRect();
		this.dropdownMenu.style.top = `${rect.bottom + 4}px`;
		this.dropdownMenu.style.left = `${rect.left + (rect.width / 2)}px`;

		this.dropdownMenu.classList.add('show');
	}

	private closeDropdown(): void {
		this._isOpen = false;
		this.element.classList.remove('open');
		this.dropdownMenu.classList.remove('show');
	}

	private updateUI(): void {
		const currentDef = OMINI_MODE_DEFINITIONS.find(d => d.mode === this._currentMode) || OMINI_MODE_DEFINITIONS[0];
		this.triggerLabel.textContent = currentDef.label;

		for (const [mode, el] of this._options) {
			el.classList.toggle('active', mode === this._currentMode);
		}
	}
}
