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

		this.suggestionsGrid = append(this.container, $('div.ominai-suggestions-grid'));
		
		this._buildSuggestions();
	}

	private _buildSuggestions(): void {
		this._createSuggestion('Plan a new feature', 'Design and architect a robust feature');
		this._createSuggestion('Refactor this code', 'Clean up the currently active file');
		this._createSuggestion('Create a website', 'Bootstrap a new React web application');
		this._createSuggestion('Find bugs', 'Analyze the current workspace for issues');
	}

	private _createSuggestion(title: string, desc: string): void {
		const card = append(this.suggestionsGrid, $('div.ominai-suggestion-card'));
		card.tabIndex = 0;
		card.setAttribute('role', 'button');
		card.setAttribute('aria-label', `Suggestion: ${title}. ${desc}`);
		
		append(card, $('div.ominai-suggestion-card-title')).textContent = title;
		append(card, $('div.ominai-suggestion-card-desc')).textContent = desc;

		this._register(addDisposableListener(card, EventType.CLICK, () => {
			// In the future: trigger the prompt input with this suggestion
		}));
		this._register(addDisposableListener(card, EventType.KEY_DOWN, (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				// Keyboard accessibility trigger
			}
		}));
	}

	public hide(): void {
		this.container.classList.add('hidden');
	}

	public show(): void {
		this.container.classList.remove('hidden');
	}
}
