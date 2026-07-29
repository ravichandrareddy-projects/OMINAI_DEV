/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append } from '../../../base/browser/dom.js';
import { IInstantiationService } from '../../../platform/instantiation/common/instantiation.js';
import { ChatMessage, IChatMessageOptions } from './chatMessage.js';

export class ConversationView extends Disposable {
	private readonly container: HTMLElement;
	private readonly feed: HTMLElement;
	private readonly liveRegion: HTMLElement;
	private loadingIndicator: HTMLElement | undefined;

	constructor(
		parent: HTMLElement,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super();
		this.container = append(parent, $('div.ominai-scrollable-container'));
		this.feed = append(this.container, $('div.ominai-conversation-feed.hidden'));
		this.feed.setAttribute('role', 'log');
		this.feed.setAttribute('aria-live', 'polite');
		this.feed.setAttribute('aria-label', 'Conversation with OMINAI');

		// Hidden live region for screen reader announcements
		this.liveRegion = append(this.container, $('div.ominai-sr-live'));
		this.liveRegion.setAttribute('aria-live', 'polite');
		this.liveRegion.setAttribute('aria-atomic', 'true');
		this.liveRegion.classList.add('hidden');
	}

	public addMessage(options: IChatMessageOptions): void {
		// Clear loading indicator if present
		this._clearLoading();

		const message = this._register(this.instantiationService.createInstance(ChatMessage, options));
		this.feed.appendChild(message.container);

		// Announce to screen readers
		this.liveRegion.textContent = `${options.role === 'user' ? 'You' : 'OMINAI'} said: ${options.content.substring(0, 100)}`;

		// Auto-scroll to bottom
		this.container.scrollTop = this.container.scrollHeight;
	}

	public showLoading(): void {
		if (!this.loadingIndicator) {
			this.loadingIndicator = append(this.feed, $('div.ominai-loading-indicator'));
			this.loadingIndicator.setAttribute('aria-label', 'OMINAI is thinking');
			this.loadingIndicator.textContent = 'OMINAI is thinking...';
			this.feed.appendChild(this.loadingIndicator);
		}
		this.liveRegion.textContent = 'OMINAI is preparing a response';
		this.container.scrollTop = this.container.scrollHeight;
	}

	private _clearLoading(): void {
		if (this.loadingIndicator) {
			this.loadingIndicator.remove();
			this.loadingIndicator = undefined;
		}
	}

	public show(): void {
		this.feed.classList.remove('hidden');
	}

	public hide(): void {
		this.feed.classList.add('hidden');
	}
}
