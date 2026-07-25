/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, EventType, addDisposableListener } from '../../../base/browser/dom.js';

export class ProjectWorkspacePanel extends Disposable {
	private readonly header: HTMLElement;
	private readonly body: HTMLElement;
	private isCollapsed = false;
	private restoreBtn: HTMLElement | undefined;

	constructor(
		private readonly container: HTMLElement
	) {
		super();
		this.container.classList.add('ominai-project-workspace-panel');

		// Header
		this.header = append(this.container, $('div.ominai-panel-header'));
		
		const title = append(this.header, $('h2.ominai-panel-title'));
		title.textContent = 'PROJECT STATUS';

		const headerActions = append(this.header, $('div.ominai-panel-header-actions'));

		const historyBtn = append(headerActions, $('button.ominai-icon-btn.history-btn'));
		historyBtn.title = 'Session History';
		append(historyBtn, $('span.codicon.codicon-history'));
		
		const moreBtn = append(headerActions, $('button.ominai-icon-btn'));
		moreBtn.title = 'More Actions';
		append(moreBtn, $('span.codicon.codicon-kebab-vertical'));

		const collapseBtn = append(headerActions, $('button.ominai-icon-btn.collapse-btn'));
		collapseBtn.title = 'Close Panel';
		append(collapseBtn, $('span.codicon.codicon-chevron-right'));

		// Body
		this.body = append(this.container, $('div.ominai-panel-body'));

		this._buildOverviewSection();
		this._buildExecutionSection();
		this._buildBrowserSection();
		this._buildGitSection();
		this._buildDiagnosticsSection();

		// Footer Settings
		const footer = append(this.container, $('div.ominai-panel-footer'));
		const settingsBtn = append(footer, $('button.ominai-settings-btn'));
		append(settingsBtn, $('span.codicon.codicon-settings-gear'));
		append(settingsBtn, $('span')).textContent = 'Settings';

		// Listeners
		this._register(addDisposableListener(historyBtn, EventType.CLICK, () => this.showHistory()));
		this._register(addDisposableListener(collapseBtn, EventType.CLICK, () => this.toggleCollapse()));

		// Create restore button but keep it hidden initially
		this.createRestoreButton();
	}

	private _buildOverviewSection(): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'OVERVIEW';

		const card = append(section, $('div.ominai-panel-card'));
		
		const currentStage = append(card, $('div.ominai-card-row'));
		append(currentStage, $('span.codicon.codicon-sync.ominai-spin')); // Mocking a spinner
		const stageContent = append(currentStage, $('div.ominai-card-row-content'));
		append(stageContent, $('div.ominai-card-row-title')).textContent = 'Current Stage';
		append(stageContent, $('div.ominai-card-row-desc')).textContent = 'Idle';

		const progress = append(card, $('div.ominai-card-row'));
		append(progress, $('span.codicon.codicon-pie-chart'));
		const progressContent = append(progress, $('div.ominai-card-row-content'));
		append(progressContent, $('div.ominai-card-row-title')).textContent = 'Progress';
		const progressBarContainer = append(progressContent, $('div.ominai-progress-container'));
		append(progressBarContainer, $('div.ominai-progress-text')).textContent = '0%';
		const progressBar = append(progressBarContainer, $('div.ominai-progress-bar'));
		append(progressBar, $('div.ominai-progress-fill')).style.width = '0%';
	}

	private _buildExecutionSection(): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'EXECUTION';

		const card = append(section, $('div.ominai-panel-card'));
		const row = append(card, $('div.ominai-card-row'));
		append(row, $('span.codicon.codicon-clock'));
		const content = append(row, $('div.ominai-card-row-content'));
		append(content, $('div.ominai-card-row-title')).textContent = 'Timeline';
		append(content, $('div.ominai-card-row-desc')).textContent = 'No tasks running';
	}

	private _buildBrowserSection(): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'BROWSER';

		const card = append(section, $('div.ominai-panel-card'));
		const row = append(card, $('div.ominai-card-row'));
		append(row, $('span.codicon.codicon-globe'));
		const content = append(row, $('div.ominai-card-row-content'));
		append(content, $('div.ominai-card-row-title')).textContent = 'Status';
		append(content, $('div.ominai-card-row-desc')).textContent = 'Not Active';
	}

	private _buildGitSection(): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'GIT';

		const grid = append(section, $('div.ominai-card-grid'));
		
		const branchCard = append(grid, $('div.ominai-panel-card.small'));
		const branchRow = append(branchCard, $('div.ominai-card-row'));
		append(branchRow, $('span.codicon.codicon-source-control'));
		const branchContent = append(branchRow, $('div.ominai-card-row-content'));
		append(branchContent, $('div.ominai-card-row-title')).textContent = 'Branch';
		append(branchContent, $('div.ominai-card-row-desc')).textContent = 'main';

		const changesCard = append(grid, $('div.ominai-panel-card.small'));
		const changesRow = append(changesCard, $('div.ominai-card-row'));
		append(changesRow, $('span.codicon.codicon-file'));
		const changesContent = append(changesRow, $('div.ominai-card-row-content'));
		append(changesContent, $('div.ominai-card-row-title')).textContent = 'Changes';
		append(changesContent, $('div.ominai-card-row-desc')).textContent = '0 files';
	}

	private _buildDiagnosticsSection(): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'DIAGNOSTICS';

		const card = append(section, $('div.ominai-panel-card'));
		
		const errors = append(card, $('div.ominai-card-row'));
		append(errors, $('span.codicon.codicon-error.error-icon'));
		const errContent = append(errors, $('div.ominai-card-row-content'));
		append(errContent, $('div.ominai-card-row-title')).textContent = 'Errors';
		append(errContent, $('div.ominai-card-row-desc')).textContent = '0';

		const warnings = append(card, $('div.ominai-card-row'));
		append(warnings, $('span.codicon.codicon-warning.warning-icon'));
		const warnContent = append(warnings, $('div.ominai-card-row-content'));
		append(warnContent, $('div.ominai-card-row-title')).textContent = 'Warnings';
		append(warnContent, $('div.ominai-card-row-desc')).textContent = '0';

		const info = append(card, $('div.ominai-card-row'));
		append(info, $('span.codicon.codicon-info.info-icon'));
		const infoContent = append(info, $('div.ominai-card-row-content'));
		append(infoContent, $('div.ominai-card-row-title')).textContent = 'Info';
		append(infoContent, $('div.ominai-card-row-desc')).textContent = '0';
	}

	private createRestoreButton(): void {
		this.restoreBtn = $('button.ominai-restore-btn');
		this.restoreBtn.title = 'Restore Workspace Panel';
		append(this.restoreBtn, $('span.codicon.codicon-chevron-left'));
		this.restoreBtn.style.display = 'none';

		// Mount to the parent of our container so it floats
		if (this.container.parentElement) {
			this.container.parentElement.appendChild(this.restoreBtn);
		} else {
			// If not mounted yet, mount it when we are added to DOM (simplified for now by just appending to container if we must, but we really want it outside)
			this.container.appendChild(this.restoreBtn);
		}

		this._register(addDisposableListener(this.restoreBtn, EventType.CLICK, () => this.toggleCollapse()));
	}

	private toggleCollapse(): void {
		this.isCollapsed = !this.isCollapsed;
		if (this.isCollapsed) {
			this.container.classList.add('collapsed');
			if (this.restoreBtn) {
				// Move restore button to parent if possible to avoid getting clipped
				if (this.container.parentElement && this.restoreBtn.parentElement !== this.container.parentElement) {
					this.container.parentElement.appendChild(this.restoreBtn);
				}
				this.restoreBtn.style.display = 'flex';
			}
		} else {
			this.container.classList.remove('collapsed');
			if (this.restoreBtn) {
				this.restoreBtn.style.display = 'none';
			}
		}
	}

	private async showHistory(): Promise<void> {
		if (!this.quickInputService || !this.sessionService) {
			this.logger.error('Services not available for history');
			return;
		}
		
		const sessions = this.sessionService.getSessions();
		const picks = sessions.map(s => ({
			label: s.title,
			description: new Date(s.createdAt).toLocaleString(),
			session: s
		}));
		
		const selected = await this.quickInputService.pick(picks, {
			placeHolder: 'Select a previous OMINAI session to resume'
		});
		
		if (selected) {
			this.sessionService.switchSession(selected.session.id);
		}
	}
}
