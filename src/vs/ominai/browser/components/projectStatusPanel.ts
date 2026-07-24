/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../platform/storage/common/storage.js';

const STATUS_PANEL_COLLAPSED_KEY = 'ominai.statusPanel.collapsed';

export class ProjectStatusPanel extends Disposable {
	private readonly container: HTMLElement;
	private readonly restoreBtn: HTMLElement;
	
	constructor(
		parent: HTMLElement,
		@IStorageService private readonly storageService: IStorageService
	) {
		super();
		this.container = append(parent, $('div.ominai-status-panel'));
		
		const isCollapsed = this.storageService.getBoolean(STATUS_PANEL_COLLAPSED_KEY, StorageScope.WORKSPACE, false);
		if (isCollapsed) {
			this.container.classList.add('collapsed');
		}

		this._buildHeader();
		this._buildContent();

		// Floating restore button that appears when panel is collapsed
		this.restoreBtn = append(parent, $('button.ominai-restore-status-btn'));
		append(this.restoreBtn, $('span.codicon.codicon-layout-sidebar-right'));
		this.restoreBtn.setAttribute('aria-label', 'Restore Project Status Panel');
		
		if (isCollapsed) {
			this.restoreBtn.classList.add('visible');
		}

		this._register(addDisposableListener(this.restoreBtn, EventType.CLICK, () => {
			this._setCollapsed(false);
		}));
	}

	private _buildHeader(): void {
		const header = append(this.container, $('div.ominai-status-header'));
		
		const title = append(header, $('div.ominai-status-title'));
		title.textContent = 'Project Status';
		
		const collapseBtn = append(header, $('button.ominai-status-collapse-btn'));
		append(collapseBtn, $('span.codicon.codicon-chevron-right'));
		collapseBtn.setAttribute('aria-label', 'Collapse Panel');

		this._register(addDisposableListener(collapseBtn, EventType.CLICK, () => {
			this._setCollapsed(true);
		}));
	}

	private _buildContent(): void {
		const content = append(this.container, $('div.ominai-status-content'));
		
		// Execution Section
		const executionSection = append(content, $('div.ominai-status-section'));
		append(executionSection, $('div.ominai-status-section-title')).textContent = 'Execution';
		this._createStatusItem(executionSection, 'Current Stage', 'Idle');
		this._createStatusItem(executionSection, 'Progress', '0%');
		
		// Workspace Section
		const wsSection = append(content, $('div.ominai-status-section'));
		append(wsSection, $('div.ominai-status-section-title')).textContent = 'Workspace';
		this._createStatusItem(wsSection, 'Git Status', 'Clean', 'success');
		this._createStatusItem(wsSection, 'Debug', 'Inactive');
		
		// Diagnostics Section
		const diagSection = append(content, $('div.ominai-status-section'));
		append(diagSection, $('div.ominai-status-section-title')).textContent = 'Diagnostics';
		this._createStatusItem(diagSection, 'Errors', '0', 'success');
		this._createStatusItem(diagSection, 'Warnings', '0');
	}

	private _createStatusItem(parent: HTMLElement, label: string, value: string, badgeType?: 'success' | 'error'): void {
		const item = append(parent, $('div.ominai-status-item'));
		
		const labelEl = append(item, $('div.ominai-status-item-label'));
		labelEl.textContent = label;
		
		const valEl = append(item, $('div.ominai-status-item-value'));
		valEl.textContent = value;
		
		if (badgeType) {
			valEl.classList.add('ominai-status-badge', badgeType);
		}
	}

	private _setCollapsed(collapsed: boolean): void {
		this.storageService.store(STATUS_PANEL_COLLAPSED_KEY, collapsed, StorageScope.WORKSPACE, StorageTarget.USER);
		if (collapsed) {
			this.container.classList.add('collapsed');
			this.restoreBtn.classList.add('visible');
		} else {
			this.container.classList.remove('collapsed');
			this.restoreBtn.classList.remove('visible');
		}
	}
}
