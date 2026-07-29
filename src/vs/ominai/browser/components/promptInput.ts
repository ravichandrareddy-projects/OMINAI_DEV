/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, MutableDisposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { Emitter, Event } from '../../../base/common/event.js';
import { IOminaiProviderService } from '../../common/ominaiServices.js';
import { ModelSelectorWidget } from './modelSelector.js';

export class PromptInput extends Disposable {
	private readonly wrapper: HTMLElement;
	private readonly container: HTMLElement;
	private readonly textarea: HTMLTextAreaElement;
	private readonly sendBtn: HTMLButtonElement;
	private readonly modelSelectorLabel: HTMLElement;
	private readonly modelSelectorWidget: ModelSelectorWidget;

	private readonly _onDidSubmitPrompt = this._register(new Emitter<string>());
	public readonly onDidSubmitPrompt: Event<string> = this._onDidSubmitPrompt.event;

	private isFirstPrompt = true;
	private isSubmitting = false;
	private readonly submitThrottle = this._register(new MutableDisposable());

	constructor(
		parent: HTMLElement,
		@IOminaiProviderService private readonly providerService: IOminaiProviderService
	) {
		super();
		this.wrapper = append(parent, $('div.ominai-prompt-wrapper.centered'));
		this.container = append(this.wrapper, $('div.ominai-prompt-container'));
		
		this.textarea = append(this.container, $('textarea.ominai-prompt-textarea')) as HTMLTextAreaElement;
		this.textarea.placeholder = 'Message OMINAI...';
		this.textarea.rows = 1;
		this.textarea.setAttribute('aria-label', 'OMINAI Message Input');
		
		const controlsBar = append(this.container, $('div.ominai-prompt-controls-bar'));
		
		// Left controls
		const leftControls = append(controlsBar, $('div.ominai-prompt-controls-left'));
		const attachBtn = append(leftControls, $('button.ominai-prompt-btn.attach-btn'));
		append(attachBtn, $('span.codicon.codicon-plus'));
		
		const contextBtn = append(leftControls, $('button.ominai-prompt-btn.context-btn'));
		append(contextBtn, $('span.codicon.codicon-mention'));
		append(contextBtn, $('span')).textContent = 'Add context';

		// Right controls
		const rightControls = append(controlsBar, $('div.ominai-prompt-controls-right'));
		const modelSelectorBtn = append(rightControls, $('button.ominai-prompt-btn.model-selector'));
		
		this.modelSelectorLabel = append(modelSelectorBtn, $('span'));
		this.modelSelectorLabel.textContent = this.providerService.getActiveProvider()?.name || 'Select Model';
		append(modelSelectorBtn, $('span.codicon.codicon-chevron-down'));

		this.modelSelectorWidget = this._register(new ModelSelectorWidget(this.wrapper, this.providerService));

		this.sendBtn = append(rightControls, $('button.ominai-prompt-send')) as HTMLButtonElement;
		append(this.sendBtn, $('span.codicon.codicon-arrow-up'));
		this.sendBtn.setAttribute('aria-label', 'Send Message');
		this.sendBtn.disabled = true;

		// Disclaimer
		const disclaimer = append(this.wrapper, $('div.ominai-prompt-disclaimer'));
		disclaimer.textContent = 'OMINAI can make mistakes. Please verify important information.';

		// Register click on the button to toggle the dropdown
		this._register(addDisposableListener(modelSelectorBtn, EventType.CLICK, (e) => {
			e.stopPropagation();
			this.modelSelectorWidget.toggle();
		}));

		this._registerListeners();
	}

	private _registerListeners(): void {
		this._register(addDisposableListener(this.textarea, EventType.INPUT, () => {
			this.sendBtn.disabled = this.textarea.value.trim().length === 0;
			// Simple auto-resize logic
			this.textarea.style.height = 'auto';
			this.textarea.style.height = `${Math.min(this.textarea.scrollHeight, 200)}px`;
		}));

		this._register(addDisposableListener(this.textarea, EventType.KEY_DOWN, (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this._submit();
			}
		}));

		this._register(addDisposableListener(this.sendBtn, EventType.CLICK, () => {
			this._submit();
		}));

		this._register(this.providerService.onDidChangeActiveProvider(provider => {
			this.modelSelectorLabel.textContent = provider.name;
		}));
	}

	private _submit(): void {
		if (this.isSubmitting) {
			return; // debounce — ignore rapid submissions
		}

		const value = this.textarea.value.trim();
		if (!value) {
			return;
		}

		this.isSubmitting = true;
		this.sendBtn.disabled = true;

		if (this.isFirstPrompt) {
			this.isFirstPrompt = false;
		}

		this._onDidSubmitPrompt.fire(value);

		this.textarea.value = '';
		this.sendBtn.disabled = true;

		// Re-enable after 300ms debounce window
		this.submitThrottle.value = {
			dispose: () => {
				this.isSubmitting = false;
			}
		};
		setTimeout(() => {
			this.submitThrottle.clear();
		}, 300);
	}

	public animateToBottom(): void {
		this.wrapper.classList.remove('centered');
	}

	public focus(): void {
		this.textarea.focus();
	}
}
