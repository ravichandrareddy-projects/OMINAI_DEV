/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append } from '../../../base/browser/dom.js';
import { ExecutionPanel } from './executionPanel.js';
import { IInstantiationService } from '../../../platform/instantiation/common/instantiation.js';

export interface IChatMessageOptions {
	role: 'user' | 'assistant';
	content: string;
	showExecutionPanel?: boolean;
}

export class ChatMessage extends Disposable {
	public readonly container: HTMLElement;

	constructor(
		options: IChatMessageOptions,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super();
		this.container = $('div.ominai-message.' + options.role);
		
		const header = append(this.container, $('div.ominai-message-header'));
		const icon = append(header, $('span.codicon'));
		
		if (options.role === 'user') {
			icon.classList.add('codicon-account');
			append(header, $('span')).textContent = 'You';
		} else {
			icon.classList.add('codicon-sparkle');
			append(header, $('span')).textContent = 'OMINAI';
		}

		// Mock execution panel before text if it's the assistant
		if (options.role === 'assistant' && options.showExecutionPanel) {
			this._register(this.instantiationService.createInstance(ExecutionPanel, this.container));
		}

		const body = append(this.container, $('div.ominai-message-body'));
		body.textContent = options.content; // Future: render markdown here
	}
}
