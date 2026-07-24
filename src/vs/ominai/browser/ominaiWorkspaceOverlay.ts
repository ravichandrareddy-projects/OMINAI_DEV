/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominai.css';
import { Disposable } from '../../base/common/lifecycle.js';
import { $, append } from '../../base/browser/dom.js';
import { IWorkbenchLayoutService } from '../../workbench/services/layout/browser/layoutService.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { WelcomeScreen } from './components/welcomeScreen.js';
import { PromptInput } from './components/promptInput.js';
import { ConversationView } from './components/conversationView.js';
import { ProjectStatusPanel } from './components/projectStatusPanel.js';
import { SessionManagerPanel } from './components/sessionManagerPanel.js';
import { IOminaiLoggerService } from '../common/ominaiServices.js';

export class OminaiWorkspaceOverlay extends Disposable {
	private readonly container: HTMLElement;
	private readonly chatArea: HTMLElement;

	private welcomeScreen: WelcomeScreen;
	private promptInput: PromptInput;
	private conversationView: ConversationView;

	constructor(
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IOminaiLoggerService private readonly logger: IOminaiLoggerService,
	) {
		super();
		this.container = $('div.ominai-workspace-overlay.hidden');

		this._register(this.instantiationService.createInstance(SessionManagerPanel, this.container));

		this.chatArea = append(this.container, $('div.ominai-chat-area'));

		// Initialize components
		this.conversationView = this._register(this.instantiationService.createInstance(ConversationView, this.chatArea));
		this.welcomeScreen = this._register(this.instantiationService.createInstance(WelcomeScreen, this.chatArea));
		this.promptInput = this._register(this.instantiationService.createInstance(PromptInput, this.chatArea));
		this._register(this.instantiationService.createInstance(ProjectStatusPanel, this.container));

		this._registerListeners();
		this.logger.trace('OminaiWorkspaceOverlay initialized.');
	}

	private _registerListeners(): void {
		// When the user submits a prompt
		this._register(this.promptInput.onDidSubmitPrompt((text) => {
			this.welcomeScreen.hide();
			this.conversationView.show();
			this.promptInput.animateToBottom();

			// Add User message
			this.conversationView.addMessage({
				role: 'user',
				content: text
			});

			// Mock: Add Assistant message slightly delayed
			setTimeout(() => {
				this.conversationView.addMessage({
					role: 'assistant',
					content: 'I am analyzing your request and beginning the execution plan.',
					showExecutionPanel: true
				});
			}, 500);
		}));
	}

	public mount(): void {
		if (this.layoutService.mainContainer) {
			this.layoutService.mainContainer.appendChild(this.container);
		} else {
			this._register(this.layoutService.onDidLayoutMainContainer(() => {
				if (!this.container.parentElement) {
					this.layoutService.mainContainer.appendChild(this.container);
				}
			}));
		}
	}

	public show(): void {
		this.container.classList.remove('hidden');
		this.logger.info('Workspace Opened');
		this.promptInput.focus();
	}

	public hide(): void {
		this.container.classList.add('hidden');
		this.logger.info('Workspace Hidden');
	}
}
