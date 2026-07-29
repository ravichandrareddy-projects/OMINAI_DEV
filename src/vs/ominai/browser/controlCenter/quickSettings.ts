/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { Emitter, Event } from '../../../base/common/event.js';

/**
 * QuickSettings — compact settings panel for the control center.
 *
 * Shows the most commonly-tweaked settings inline so the user doesn't
 * need to open the full settings window for every change.
 */
export class QuickSettings extends Disposable {
	private readonly _onDidOpenFullSettings = this._register(new Emitter<void>());
	public readonly onDidOpenFullSettings: Event<void> = this._onDidOpenFullSettings.event;

	constructor(private readonly container: HTMLElement) {
		super();
		this.container.classList.add('ominai-quick-settings');
		this.build();
	}

	private build(): void {
		// Header
		const header = append(this.container, $('div.ominai-quick-settings-header'));
		append(header, $('span.codicon.codicon-settings-gear'));
		const headerText = append(header, $('span.ominai-quick-settings-header-text'));
		headerText.textContent = 'Quick Settings';

		// Model selector (most important setting)
		const modelGroup = this._group('Model');
		this._toggleRow(modelGroup, 'codicon-rocket', 'Default Model', 'Anthropic Claude', 'Change');

		// Toggles for common preferences
		const behaviorGroup = this._group('Behavior');
		this._inlineToggle(behaviorGroup, 'codicon-check', 'Plan before executing', true);
		this._inlineToggle(behaviorGroup, 'codicon-terminal', 'Auto-run terminal commands', false);
		this._inlineToggle(behaviorGroup, 'codicon-eye', 'Browser automation', true);
		this._inlineToggle(behaviorGroup, 'codicon-globe', 'Allow network requests', true);

		// Appearance quick toggles
		const appearanceGroup = this._group('Appearance');
		this._inlineToggle(appearanceGroup, 'codicon-color-mode', 'Compact mode', false);
		this._inlineToggle(appearanceGroup, 'codicon-bell', 'Notifications', true);

		// Open full settings button
		append(this.container, $('div.ominai-quick-settings-spacer'));

		const openBtn = append(this.container, $('button.ominai-quick-settings-full-btn'));
		append(openBtn, $('span.codicon.codicon-arrow-right'));
		append(openBtn, $('span')).textContent = 'Open Full Settings';

		this._register(addDisposableListener(openBtn, EventType.CLICK, () => {
			this._onDidOpenFullSettings.fire();
		}));
	}

	private _group(label: string): HTMLElement {
		const group = append(this.container, $('div.ominai-quick-settings-group'));
		append(group, $('div.ominai-quick-settings-group-title')).textContent = label;
		return group;
	}

	private _toggleRow(parent: HTMLElement, icon: string, label: string, value: string, actionLabel: string): void {
		const row = append(parent, $('div.ominai-quick-settings-row'));
		append(row, $(`span.codicon.${icon}`));
		const content = append(row, $('div.ominai-quick-settings-row-content'));
		append(content, $('div.ominai-quick-settings-row-label')).textContent = label;
		append(content, $('div.ominai-quick-settings-row-value')).textContent = value;
		const action = append(row, $('button.ominai-quick-settings-row-action'));
		action.textContent = actionLabel;
	}

	private _inlineToggle(parent: HTMLElement, icon: string, label: string, defaultOn: boolean): void {
		const row = append(parent, $('div.ominai-quick-settings-row'));
		append(row, $(`span.codicon.${icon}`));
		const content = append(row, $('div.ominai-quick-settings-row-content'));
		append(content, $('div.ominai-quick-settings-row-label')).textContent = label;

		let on = defaultOn;
		const toggle = append(row, $('button.ominai-quick-toggle'));
		if (on) toggle.classList.add('on');
		append(toggle, $('span.ominai-quick-toggle-thumb'));

		this._register(addDisposableListener(toggle, EventType.CLICK, () => {
			on = !on;
			toggle.classList.toggle('on', on);
		}));
	}
}
