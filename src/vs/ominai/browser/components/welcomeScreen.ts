/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';

export class WelcomeScreen extends Disposable {
	private readonly container: HTMLElement;
	private readonly suggestionsGrid: HTMLElement;

	constructor(parent: HTMLElement) {
		super();
		this.container = append(parent, $('div.ominai-welcome-container'));
		
		const logo = append(this.container, $('div.ominai-logo'));
		logo.textContent = 'OMINAI';
		
		const greeting = append(this.container, $('div.ominai-greeting'));
		greeting.textContent = 'How can I help you build today?';

		// Action Cards
		this.suggestionsGrid = append(this.container, $('div.ominai-action-cards-grid'));
		this._buildActionCards();

		// Suggestions Separator
		const suggestionsSeparator = append(this.container, $('div.ominai-separator'));
		append(suggestionsSeparator, $('span.ominai-separator-text')).textContent = 'Suggestions';

		// Chips
		const chipsContainer = append(this.container, $('div.ominai-chips-container'));
		this._createChip(chipsContainer, 'Add authentication to the app');
		this._createChip(chipsContainer, 'Optimize database queries');
		this._createChip(chipsContainer, 'Fix TypeScript errors');
		this._createChip(chipsContainer, 'Add dark mode');

		// Start Conversation Separator
		const startConvSeparator = append(this.container, $('div.ominai-separator.start-conversation'));
		append(startConvSeparator, $('span.ominai-separator-text')).textContent = 'Start a conversation';
	}

	private _buildActionCards(): void {
		this._createActionCard('Plan a new feature', 'Design and architect a robust feature', 'codicon-hubot');
		this._createActionCard('Refactor this code', 'Clean up and improve your code', 'codicon-code');
		this._createActionCard('Create a website', 'Bootstrap a new web application', 'codicon-globe');
		this._createActionCard('Find bugs', 'Analyze and fix issues in your code', 'codicon-bug');
	}

	private _createActionCard(title: string, desc: string, iconClass: string): void {
		const card = append(this.suggestionsGrid, $('div.ominai-action-card'));
		card.tabIndex = 0;
		card.setAttribute('role', 'button');
		card.setAttribute('aria-label', `Action: ${title}. ${desc}`);
		
		const iconContainer = append(card, $('div.ominai-action-card-icon'));
		append(iconContainer, $(`span.codicon.${iconClass}`));

		append(card, $('div.ominai-action-card-title')).textContent = title;
		append(card, $('div.ominai-action-card-desc')).textContent = desc;

		this._register(addDisposableListener(card, EventType.CLICK, () => {}));
		this._register(addDisposableListener(card, EventType.KEY_DOWN, (e) => {}));
	}

	private _createChip(parent: HTMLElement, text: string): void {
		const chip = append(parent, $('button.ominai-suggestion-chip'));
		chip.textContent = text;
		this._register(addDisposableListener(chip, EventType.CLICK, () => {}));
	}

	public hide(): void {
		this.container.classList.add('hidden');
	}

	public show(): void {
		this.container.classList.remove('hidden');
	}
}
