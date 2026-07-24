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

	constructor(
		parent: HTMLElement,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super();
		this.container = append(parent, $('div.ominai-scrollable-container'));
		this.feed = append(this.container, $('div.ominai-conversation-feed.hidden'));
	}

	public addMessage(options: IChatMessageOptions): void {
		const message = this._register(this.instantiationService.createInstance(ChatMessage, options));
		this.feed.appendChild(message.container);
		// Auto-scroll to bottom
		this.container.scrollTop = this.container.scrollHeight;
	}

	public show(): void {
		this.feed.classList.remove('hidden');
	}

	public hide(): void {
		this.feed.classList.add('hidden');
	}
}
