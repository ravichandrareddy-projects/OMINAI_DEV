/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominai.css';
import { Disposable } from '../../base/common/lifecycle.js';
import { $, append } from '../../base/browser/dom.js';
import { IWorkbenchLayoutService, Parts } from '../../workbench/services/layout/browser/layoutService.js';
import { mainWindow } from '../../base/browser/window.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { WelcomeScreen } from './components/welcomeScreen.js';
import { PromptInput } from './components/promptInput.js';
import { ConversationView } from './components/conversationView.js';
import { ProjectWorkspacePanel } from './components/projectWorkspacePanel.js';
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

		this.chatArea = append(this.container, $('div.ominai-chat-area'));
		const rightPanel = append(this.container, $('div.ominai-right-panel'));

		// Initialize components
		this.conversationView = this._register(this.instantiationService.createInstance(ConversationView, this.chatArea));
		this.welcomeScreen = this._register(this.instantiationService.createInstance(WelcomeScreen, this.chatArea));
		this.promptInput = this._register(this.instantiationService.createInstance(PromptInput, this.chatArea));
		this._register(this.instantiationService.createInstance(ProjectWorkspacePanel, rightPanel));

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
		const editorContainer = this.layoutService.getContainer(mainWindow, Parts.EDITOR_PART);
		if (editorContainer) {
			editorContainer.appendChild(this.container);
		} else {
			this._register(this.layoutService.onDidLayoutMainContainer(() => {
				if (!this.container.parentElement) {
					const ec = this.layoutService.getContainer(mainWindow, Parts.EDITOR_PART);
					if (ec) {
						ec.appendChild(this.container);
					}
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
