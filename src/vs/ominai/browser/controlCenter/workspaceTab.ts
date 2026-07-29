/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append } from '../../../base/browser/dom.js';
import { IOminaiBrowserService, IOminaiProjectService, IOminaiExecutionService } from '../../common/ominaiServices.js';

/**
 * Data contract for the WorkspaceTab.
 *
 * Filled by mock data in the UI layer; the future IOminaiService
 * will provide real values without changing this component.
 */
export interface IWorkspaceData {
	projectName: string;
	currentStage: string;
	progress: number; // 0–100
	stageDescription: string;

	executionState: 'idle' | 'running' | 'completed' | 'error';
	executionSummary: string;

	browserStatus: 'active' | 'inactive' | 'error';
	browserSummary: string;

	gitBranch: string;
	gitChanges: number;

	errors: number;
	warnings: number;
	info: number;
}

const DEFAULT_WORKSPACE_DATA: IWorkspaceData = {
	projectName: 'Untitled',
	currentStage: 'Idle',
	progress: 0,
	stageDescription: 'No tasks in progress',

	executionState: 'idle',
	executionSummary: 'No tasks running',

	browserStatus: 'inactive',
	browserSummary: 'Not Active',

	gitBranch: 'main',
	gitChanges: 0,

	errors: 0,
	warnings: 0,
	info: 0,
};

export class WorkspaceTab extends Disposable {
	private readonly body: HTMLElement;
	// Track data refs for targeted updates
	private lastData: IWorkspaceData;

	constructor(
		private readonly container: HTMLElement,
		data: IWorkspaceData = DEFAULT_WORKSPACE_DATA,
		@IOminaiBrowserService private readonly browserService: IOminaiBrowserService,
		@IOminaiProjectService private readonly projectService: IOminaiProjectService,
		@IOminaiExecutionService private readonly executionService: IOminaiExecutionService,
	) {
		super();
		this.lastData = { ...data };
		this.container.classList.add('ominai-workspace-tab');

		this.body = append(this.container, $('div.ominai-panel-body'));

		this._buildSections(this.lastData);

		// Subscribe to service changes and refresh automatically
		this._register(this.browserService.onDidChangeBackendState(() => this._refreshFromServices()));
		this._register(this.projectService.onDidChangeProjectState(() => this._refreshFromServices()));
		this._register(this.executionService.onDidChangeExecutionState(() => this._refreshFromServices()));

		// Initial data pull from services
		this._refreshFromServices();
	}

	/**
	 * Update the tab with fresh data using targeted DOM updates.
	 */
	public update(data: IWorkspaceData): void {
		// Compare and update only changed fields
		const prev = this.lastData;

		if (data.projectName !== prev.projectName) {
			this._updateTextContent('.ominai-project-name', data.projectName);
		}
		if (data.currentStage !== prev.currentStage) {
			this._updateTextContent('.ominai-stage-desc', data.currentStage);
		}
		if (data.progress !== prev.progress) {
			this._updateTextContent('.ominai-progress-text', `${data.progress}%`);
			this._updateStyle('.ominai-progress-fill', 'width', `${data.progress}%`);
		}
		if (data.executionState !== prev.executionState || data.executionSummary !== prev.executionSummary) {
			this._updateTextContent('.ominai-exec-summary', data.executionSummary);
		}
		if (data.browserStatus !== prev.browserStatus || data.browserSummary !== prev.browserSummary) {
			this._updateTextContent('.ominai-browser-summary', data.browserSummary);
		}
		if (data.gitBranch !== prev.gitBranch) {
			this._updateTextContent('.ominai-git-branch', data.gitBranch);
		}
		if (data.gitChanges !== prev.gitChanges) {
			this._updateTextContent('.ominai-git-changes', `${data.gitChanges} file${data.gitChanges !== 1 ? 's' : ''}`);
		}
		if (data.errors !== prev.errors) {
			this._updateTextContent('.ominai-errors-count', `${data.errors}`);
		}
		if (data.warnings !== prev.warnings) {
			this._updateTextContent('.ominai-warnings-count', `${data.warnings}`);
		}
		if (data.info !== prev.info) {
			this._updateTextContent('.ominai-info-count', `${data.info}`);
		}

		this.lastData = { ...data };
	}

	/**
	 * Pull current state from injected services and push it into the tab view.
	 * Called once at construction and on every service state change.
	 */
	private _refreshFromServices(): void {
		const isRunning = this.browserService.isRunning;
		const execState = this.executionService.getCurrentState();
		const progress = this.projectService.getProgress();

		this.update({
			projectName: this.projectService.getProjectName(),
			currentStage: isRunning ? 'Backend Active' : 'Idle',
			progress,
			stageDescription: this.projectService.getCurrentTask(),
			executionState: execState,
			executionSummary: execState === 'running' ? 'Executing task...' : 'No tasks running',
			browserStatus: isRunning ? 'active' : 'inactive',
			browserSummary: isRunning ? 'Connected' : 'Not Active',
			gitBranch: 'main',
			gitChanges: 0,
			errors: 0,
			warnings: 0,
			info: 0,
		});
	}

	private _updateTextContent(selector: string, text: string): void {
		const el = this.body.querySelector(selector);
		if (el) {
			el.textContent = text;
		}
	}

	private _updateStyle(selector: string, prop: string, value: string): void {
		const el = this.body.querySelector(selector) as HTMLElement | null;
		if (el) {
			el.style[prop as any] = value;
		}
	}

	private _buildSections(data: IWorkspaceData): void {
		this._buildOverviewSection(data);
		this._buildExecutionSection(data);
		this._buildBrowserSection(data);
		this._buildGitSection(data);
		this._buildDiagnosticsSection(data);
	}

	private _buildOverviewSection(data: IWorkspaceData): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'OVERVIEW';

		const card = append(section, $('div.ominai-panel-card'));

		// Project Name
		const nameRow = append(card, $('div.ominai-card-row'));
		append(nameRow, $('span.codicon.codicon-project'));
		const nameContent = append(nameRow, $('div.ominai-card-row-content'));
		append(nameContent, $('div.ominai-card-row-title')).textContent = 'Project';
		append(nameContent, $('div.ominai-card-row-desc.ominai-project-name')).textContent = data.projectName;

		// Current Stage
		const stageRow = append(card, $('div.ominai-card-row'));
		append(stageRow, $(`span.codicon.codicon-sync${data.executionState === 'running' ? '.ominai-spin' : ''}`));
		const stageContent = append(stageRow, $('div.ominai-card-row-content'));
		append(stageContent, $('div.ominai-card-row-title')).textContent = 'Current Stage';
		const stageDesc = append(stageContent, $('div.ominai-card-row-desc.ominai-stage-desc'));
		stageDesc.textContent = data.currentStage;

		// Progress bar
		const progressRow = append(card, $('div.ominai-card-row'));
		append(progressRow, $('span.codicon.codicon-pie-chart'));
		const progressContent = append(progressRow, $('div.ominai-card-row-content'));
		append(progressContent, $('div.ominai-card-row-title')).textContent = 'Progress';
		const progressBarContainer = append(progressContent, $('div.ominai-progress-container'));
		append(progressBarContainer, $('div.ominai-progress-text')).textContent = `${data.progress}%`;
		const progressBar = append(progressBarContainer, $('div.ominai-progress-bar'));
		const fill = append(progressBar, $('div.ominai-progress-fill'));
		fill.style.width = `${data.progress}%`;
	}

	private _buildExecutionSection(data: IWorkspaceData): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'EXECUTION';

		const card = append(section, $('div.ominai-panel-card'));

		const row = append(card, $('div.ominai-card-row'));
		const stateIcon = this._executionStateIcon(data.executionState);
		append(row, stateIcon);
		const content = append(row, $('div.ominai-card-row-content'));
		append(content, $('div.ominai-card-row-title')).textContent = 'Status';
		append(content, $('div.ominai-card-row-desc.ominai-exec-summary')).textContent = data.executionSummary;
	}

	private _executionStateIcon(state: string): HTMLElement {
		switch (state) {
			case 'running':
				return $('span.codicon.codicon-loading.ominai-spin.ominai-exec-running');
			case 'completed':
				return $('span.codicon.codicon-check.ominai-exec-completed');
			case 'error':
				return $('span.codicon.codicon-error.ominai-exec-error');
			default:
				return $('span.codicon.codicon-circle-slash.ominai-exec-idle');
		}
	}

	private _buildBrowserSection(data: IWorkspaceData): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'BROWSER';

		const card = append(section, $('div.ominai-panel-card'));

		const row = append(card, $('div.ominai-card-row'));
		const icon = data.browserStatus === 'active'
			? $('span.codicon.codicon-globe.ominai-browser-active')
			: $('span.codicon.codicon-globe');
		append(row, icon);
		const content = append(row, $('div.ominai-card-row-content'));
		append(content, $('div.ominai-card-row-title')).textContent = 'Status';
		append(content, $('div.ominai-card-row-desc.ominai-browser-summary')).textContent = data.browserSummary;
	}

	private _buildGitSection(data: IWorkspaceData): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'GIT';

		const grid = append(section, $('div.ominai-card-grid'));
		const changesLabel = `${data.gitChanges} file${data.gitChanges !== 1 ? 's' : ''}`;

		this._buildGridCard(grid, 'codicon-source-control', 'Branch', data.gitBranch, 'ominai-git-branch');
		this._buildGridCard(grid, 'codicon-file', 'Changes', changesLabel, 'ominai-git-changes');
	}

	private _buildDiagnosticsSection(data: IWorkspaceData): void {
		const section = append(this.body, $('div.ominai-panel-section'));
		append(section, $('div.ominai-section-heading')).textContent = 'DIAGNOSTICS';

		const card = append(section, $('div.ominai-panel-card'));

		const errorRow = append(card, $('div.ominai-card-row'));
		append(errorRow, $('span.codicon.codicon-error.error-icon'));
		const errContent = append(errorRow, $('div.ominai-card-row-content'));
		append(errContent, $('div.ominai-card-row-title')).textContent = 'Errors';
		append(errContent, $('div.ominai-card-row-desc.ominai-errors-count')).textContent = `${data.errors}`;

		const warningRow = append(card, $('div.ominai-card-row'));
		append(warningRow, $('span.codicon.codicon-warning.warning-icon'));
		const warnContent = append(warningRow, $('div.ominai-card-row-content'));
		append(warnContent, $('div.ominai-card-row-title')).textContent = 'Warnings';
		append(warnContent, $('div.ominai-card-row-desc.ominai-warnings-count')).textContent = `${data.warnings}`;

		const infoRow = append(card, $('div.ominai-card-row'));
		append(infoRow, $('span.codicon.codicon-info.info-icon'));
		const infoContent = append(infoRow, $('div.ominai-card-row-content'));
		append(infoContent, $('div.ominai-card-row-title')).textContent = 'Info';
		append(infoContent, $('div.ominai-card-row-desc.ominai-info-count')).textContent = `${data.info}`;
	}

	private _buildGridCard(grid: HTMLElement, icon: string, title: string, value: string, valueClass?: string): void {
		const card = append(grid, $('div.ominai-panel-card.small'));
		const row = append(card, $('div.ominai-card-row'));
		append(row, $(`span.codicon.${icon}`));
		const content = append(row, $('div.ominai-card-row-content'));
		append(content, $('div.ominai-card-row-title')).textContent = title;
		append(content, $('div.ominai-card-row-desc' + (valueClass ? `.${valueClass}` : ''))).textContent = value;
	}
}
