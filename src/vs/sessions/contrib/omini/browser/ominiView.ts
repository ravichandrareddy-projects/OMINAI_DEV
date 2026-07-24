/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominiView.css';
import { $, append, clearNode } from '../../../../base/browser/dom.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { OMINI_BROWSER_PROVIDERS } from '../common/ominiSessionConfig.js';
import { localize } from '../../../../nls.js';

/**
 * OMINI mode main view — the central UI shown when the user switches to
 * OMINI (orchestration) mode.
 *
 * Sections:
 *   1. Task input bar  — describe what to orchestrate
 *   2. Browser sessions — cards for each AI provider
 *   3. Files / results  — collected context and results log
 *
 * For Phase 1 this is a static layout. Wiring to actual browser automation
 * and agent orchestration will be added in later phases.
 */
export class OMINIView extends Disposable {

	/** Root DOM element — insert this into the document. */
	readonly element: HTMLElement;

	private readonly _taskInput: HTMLTextAreaElement;
	private readonly _browserGrid: HTMLElement;
	private readonly _resultsSection: HTMLElement;

	constructor() {
		super();

		this.element = $('.omini-view');

		// ── 1. Hero / task input ──
		const hero = append(this.element, $('.omini-view-hero'));
		const heroTitle = append(hero, $('.omini-view-hero-title'));
		heroTitle.textContent = localize('omini.view.hero', "What shall we build today?");
		const heroSubtitle = append(hero, $('.omini-view-hero-subtitle'));
		heroSubtitle.textContent = localize('omini.view.hero.subtitle', "Describe your task — OMINI will orchestrate AI providers to get it done.");

		const inputBar = append(hero, $('.omini-view-input-bar'));
		this._taskInput = append(inputBar, $('textarea.omini-view-input')) as HTMLTextAreaElement;
		this._taskInput.placeholder = localize('omini.view.input.placeholder', "Describe the orchestration task…");
		this._taskInput.rows = 2;

		const submitBtn = append(inputBar, $('button.omini-view-submit'));
		submitBtn.textContent = '🚀 ' + localize('omini.view.submit', "Orchestrate");
		submitBtn.addEventListener('click', () => this._onSubmit());

		// ── 2. Browser session cards ──
		this._browserGrid = append(this.element, $('.omini-view-browser-grid'));
		this._renderBrowserGrid();

		// ── 3. Two-column bottom: files + results ──
		const bottom = append(this.element, $('.omini-view-bottom'));

		// Files / context panel
		const filesPanel = append(bottom, $('.omini-view-panel.omini-view-files'));
		append(filesPanel, $('.omini-view-panel-header', undefined,
			localize('omini.view.files', "📁 Context & Files")));
		const filesBody = append(filesPanel, $('.omini-view-panel-body'));
		append(filesBody, $('.omini-view-placeholder', undefined,
			localize('omini.view.files.empty', "No files collected yet. Files gathered during orchestration will appear here.")));

		// Results log panel
		const resultsPanel = append(bottom, $('.omini-view-panel.omini-view-results'));
		append(resultsPanel, $('.omini-view-panel-header', undefined,
			localize('omini.view.results', "📋 Results Log")));
		this._resultsSection = append(resultsPanel, $('.omini-view-panel-body'));
		append(this._resultsSection, $('.omini-view-placeholder', undefined,
			localize('omini.view.results.empty', "No results yet. Results from each AI provider will be logged here.")));

	}

	private _renderBrowserGrid(): void {
		clearNode(this._browserGrid);

		for (const provider of OMINI_BROWSER_PROVIDERS) {
			const card = append(this._browserGrid, $('.omini-view-browser-card'));
			card.setAttribute('data-provider', provider.id);

			const icon = append(card, $('.omini-view-browser-card-icon'));
			icon.textContent = provider.icon;

			append(card, $('.omini-view-browser-card-name', undefined, provider.label));

			const status = append(card, $('.omini-view-browser-card-status'));
			status.textContent = localize('omini.view.browser.idle', "Idle");
			status.classList.add('status-idle');

			append(card, $('.omini-view-browser-card-desc', undefined,
				localize('omini.view.browser.desc', "Browser session ready")));
		}
	}

	private _onSubmit(): void {
		const text = this._taskInput.value.trim();
		if (!text) {
			return;
		}

		// Placeholder: log the task in the results panel
		// In later phases this will dispatch to the orchestration engine
		clearNode(this._resultsSection);
		const entry = append(this._resultsSection, $('.omini-view-log-entry'));
		const header = append(entry, $('.omini-view-log-entry-header'));
		header.textContent = localize('omini.view.taskQueued', "📝 Task queued");
		const body = append(entry, $('.omini-view-log-entry-body'));
		body.textContent = text;

		this._taskInput.value = '';
	}
}
