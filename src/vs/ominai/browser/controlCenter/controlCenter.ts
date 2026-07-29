/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { IOminaiLoggerService } from '../../common/ominaiServices.js';
import { ControlCenterTab, TabNavigation } from './tabNavigation.js';
import { Emitter, Event } from '../../../base/common/event.js';

export class ControlCenter extends Disposable {
	private readonly tabNav: TabNavigation;
	private readonly contentArea: HTMLElement;
	private readonly tabPanes: Map<ControlCenterTab, HTMLElement> = new Map();
	private isCollapsed = false;
	private restoreBtn: HTMLElement | undefined;

	private readonly _onDidClickSettings = this._register(new Emitter<void>());
	readonly onDidClickSettings: Event<void> = this._onDidClickSettings.event;

	constructor(
		private readonly parent: HTMLElement,
		@IOminaiLoggerService private readonly logger: IOminaiLoggerService,
	) {
		super();
		this.parent.classList.add('ominai-control-center');

		// Tab navigation
		this.tabNav = this._register(new TabNavigation(this.parent));
		this._register(this.tabNav.onDidSwitchTab(tabId => this.onTabSwitch(tabId)));

		// Content area
		this.contentArea = append(this.parent, $('div.ominai-tab-content'));

		// Create content panes for each tab
		const tabs: ControlCenterTab[] = ['workspace', 'activity', 'history'];
		for (const tabId of tabs) {
			const pane = append(this.contentArea, $(`div.ominai-tab-pane.ominai-tab-pane-${tabId}`));
			if (tabId === 'workspace') {
				pane.classList.add('active');
			}
			this.tabPanes.set(tabId, pane);
		}

		// Collapse button in the tab nav area
		this.createCollapseButton();

		// Settings button
		this.createSettingsButton();

		// Restore button (hidden until collapsed)
		this.createRestoreButton();

		this.logger.trace('ControlCenter initialized');
	}

	/**
	 * Returns the content pane for the given tab, so later phases
	 * can mount tab components into it.
	 */
	public getTabPane(tabId: ControlCenterTab): HTMLElement | undefined {
		return this.tabPanes.get(tabId);
	}

	private onTabSwitch(tabId: ControlCenterTab): void {
		for (const [id, pane] of this.tabPanes) {
			if (id === tabId) {
				pane.classList.add('active');
			} else {
				pane.classList.remove('active');
			}
		}
		this.logger.trace(`Switched to tab: ${tabId}`);
	}

	public switchTab(tabId: ControlCenterTab): void {
		this.tabNav.switchTab(tabId);
	}

	private createCollapseButton(): void {
		const collapseBtn = append(this.parent, $('button.ominai-control-center-collapse'));
		collapseBtn.title = 'Collapse Panel';
		append(collapseBtn, $('span.codicon.codicon-chevron-right'));
		this._register(addDisposableListener(collapseBtn, EventType.CLICK, () => this.toggleCollapse()));
	}

	public toggleCollapse(): void {
		this.isCollapsed = !this.isCollapsed;
		if (this.isCollapsed) {
			this.parent.classList.add('collapsed');
			if (this.restoreBtn) {
				if (this.parent.parentElement && this.restoreBtn.parentElement !== this.parent.parentElement) {
					this.parent.parentElement.appendChild(this.restoreBtn);
				}
				this.restoreBtn.style.display = 'flex';
			}
		} else {
			this.parent.classList.remove('collapsed');
			if (this.restoreBtn) {
				this.restoreBtn.style.display = 'none';
			}
		}
	}

	private createRestoreButton(): void {
		this.restoreBtn = $('button.ominai-restore-btn');
		this.restoreBtn.title = 'Restore Control Center';
		append(this.restoreBtn, $('span.codicon.codicon-chevron-left'));
		this.restoreBtn.style.display = 'none';

		if (this.parent.parentElement) {
			this.parent.parentElement.appendChild(this.restoreBtn);
		} else {
			this.parent.appendChild(this.restoreBtn);
		}

		this._register(addDisposableListener(this.restoreBtn, EventType.CLICK, () => this.toggleCollapse()));
	}

	private createSettingsButton(): void {
		const settingsBtn = append(this.parent, $('button.ominai-control-center-settings'));
		settingsBtn.title = 'Settings';
		append(settingsBtn, $('span.codicon.codicon-settings-gear'));
		this._register(addDisposableListener(settingsBtn, EventType.CLICK, () => this._onDidClickSettings.fire()));
	}
}
