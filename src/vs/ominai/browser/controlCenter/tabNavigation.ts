/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { Emitter, Event } from '../../../base/common/event.js';

export type ControlCenterTab = 'workspace' | 'activity' | 'history';

export interface ITabDefinition {
	id: ControlCenterTab;
	label: string;
	iconClass: string;
}

const DEFAULT_TABS: ITabDefinition[] = [
	{ id: 'workspace', label: 'Workspace', iconClass: 'codicon codicon-project' },
	{ id: 'activity', label: 'Activity', iconClass: 'codicon codicon-list-tree' },
	{ id: 'history', label: 'History', iconClass: 'codicon codicon-history' },
];

export class TabNavigation extends Disposable {
	private readonly container: HTMLElement;
	private readonly tabButtons: Map<ControlCenterTab, HTMLElement> = new Map();
	private activeTab: ControlCenterTab;

	private readonly _onDidSwitchTab = this._register(new Emitter<ControlCenterTab>());
	readonly onDidSwitchTab: Event<ControlCenterTab> = this._onDidSwitchTab.event;

	constructor(
		parent: HTMLElement,
		tabs: ITabDefinition[] = DEFAULT_TABS,
		initialTab: ControlCenterTab = 'workspace'
	) {
		super();
		this.activeTab = initialTab;
		this.container = append(parent, $('div.ominai-tab-navigation'));
		this.container.setAttribute('role', 'tablist');
		this.container.setAttribute('aria-label', 'Control Center Tabs');

		// Left spacer
		append(this.container, $('div.ominai-tab-spacer'));

		for (const tab of tabs) {
			const btn = append(this.container, $('button.ominai-tab-btn'));
			btn.dataset.tabId = tab.id;
			btn.title = tab.label;
			btn.setAttribute('role', 'tab');
			btn.setAttribute('aria-selected', String(tab.id === this.activeTab));

			// Icon
			append(btn, $(`span.${tab.iconClass}`));

			// Label
			const labelEl = append(btn, $('span.ominai-tab-label'));
			labelEl.textContent = tab.label;

			if (tab.id === this.activeTab) {
				btn.classList.add('active');
			}

			this._register(addDisposableListener(btn, EventType.CLICK, () => {
				this.switchTab(tab.id);
			}));

			this.tabButtons.set(tab.id, btn);
		}

		// Right spacer fills remaining space
		const rightSpacer = append(this.container, $('div.ominai-tab-spacer'));
		rightSpacer.classList.add('fill');
	}

	public switchTab(tabId: ControlCenterTab): void {
		if (tabId === this.activeTab) {
			return;
		}

		const currentBtn = this.tabButtons.get(this.activeTab);
		if (currentBtn) {
			currentBtn.classList.remove('active');
			currentBtn.setAttribute('aria-selected', 'false');
		}

		const newBtn = this.tabButtons.get(tabId);
		if (newBtn) {
			newBtn.classList.add('active');
			newBtn.setAttribute('aria-selected', 'true');
		}

		this.activeTab = tabId;
		this._onDidSwitchTab.fire(tabId);
	}

	public getActiveTab(): ControlCenterTab {
		return this.activeTab;
	}
}
