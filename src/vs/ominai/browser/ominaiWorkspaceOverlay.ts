/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominai.css';
import { Disposable, MutableDisposable } from '../../base/common/lifecycle.js';
import { $, append } from '../../base/browser/dom.js';
import { IWorkbenchLayoutService, Parts } from '../../workbench/services/layout/browser/layoutService.js';
import { mainWindow } from '../../base/browser/window.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { WelcomeScreen } from './components/welcomeScreen.js';
import { PromptInput } from './components/promptInput.js';
import { ConversationView } from './components/conversationView.js';
import { ControlCenter } from './controlCenter/controlCenter.js';
import { WorkspaceTab } from './controlCenter/workspaceTab.js';
import { ActivityTab } from './controlCenter/activityTab.js';
import { HistoryTab } from './controlCenter/historyTab.js';
import { IOminaiLoggerService, IOminaiBrowserService } from '../common/ominaiServices.js';
import { OminaiSettingsWindow } from './settingsWindow/ominaiSettingsWindow.js';

export class OminaiWorkspaceOverlay extends Disposable {
	private readonly container: HTMLElement;
	private readonly chatArea: HTMLElement;

	private welcomeScreen: WelcomeScreen;
	private promptInput: PromptInput;
	private conversationView: ConversationView;
	private settingsWindowInstance = this._register(new MutableDisposable<OminaiSettingsWindow>());

	constructor(
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IOminaiLoggerService private readonly logger: IOminaiLoggerService,
		@IOminaiBrowserService private readonly browserService: IOminaiBrowserService,
	) {
		super();
		this.container = $('div.ominai-workspace-overlay.hidden');

		this.chatArea = append(this.container, $('div.ominai-chat-area'));
		const rightPanel = append(this.container, $('div.ominai-right-panel'));

		// Initialize components
		this.conversationView = this._register(this.instantiationService.createInstance(ConversationView, this.chatArea));
		this.welcomeScreen = this._register(this.instantiationService.createInstance(WelcomeScreen, this.chatArea));
		this.promptInput = this._register(this.instantiationService.createInstance(PromptInput, this.chatArea));
		const controlCenter = this._register(this.instantiationService.createInstance(ControlCenter, rightPanel));

		// Mount tab content components into their respective panes using DI
		const workspacePane = controlCenter.getTabPane('workspace');
		if (workspacePane) {
			this._register(this.instantiationService.createInstance(WorkspaceTab, workspacePane));
		}

		const activityPane = controlCenter.getTabPane('activity');
		if (activityPane) {
			this._register(this.instantiationService.createInstance(ActivityTab, activityPane));
		}

		const historyPane = controlCenter.getTabPane('history');
		if (historyPane) {
			this._register(this.instantiationService.createInstance(HistoryTab, historyPane));
		}

		this._register(controlCenter.onDidClickSettings(() => {
			this._openSettingsWindow();
		}));

		this._registerListeners();
		this.logger.trace('OminaiWorkspaceOverlay initialized.');
	}

	private _openSettingsWindow(): void {
		try {
			// Dispose previous instance if exists (singleton guard)
			this.settingsWindowInstance.clear();
			const win = this.instantiationService.createInstance(OminaiSettingsWindow, this.container);
			this.settingsWindowInstance.value = win;
		} catch (error: any) {
			this.logger.error('Failed to open settings window', error);
		}
	}

	private _registerListeners(): void {
		// When the user submits a prompt
		this._register(this.promptInput.onDidSubmitPrompt((text) => {
			this._onPromptSubmitted(text);
		}));

		// When a welcome screen suggestion is clicked
		this._register(this.welcomeScreen.onDidClickSuggestion((text) => {
			this._onPromptSubmitted(text);
		}));
	}

	private async _onPromptSubmitted(text: string): Promise<void> {
		try {
			this.welcomeScreen.hide();
			this.conversationView.show();
			this.promptInput.animateToBottom();

			// Add User message
			this.conversationView.addMessage({
				role: 'user',
				content: text
			});

			// Show loading indicator
			this.conversationView.showLoading();

			// Auto-start backend if not running
			if (!this.browserService.isRunning) {
				const startResult = await this.browserService.startBackend();
				if (!startResult.success) {
					this.conversationView.addMessage({
						role: 'assistant',
						content: `Failed to start backend: ${startResult.error ?? 'unknown error'}`
					});
					return;
				}
			}

			// Send prompt through the browser service
			const result = await this.browserService.runSinglePrompt('anthropic-claude3', text);
			if (!this._store.isDisposed) {
				if (result.success) {
					this.conversationView.addMessage({
						role: 'assistant',
						content: result.data ?? '(empty response)',
						showExecutionPanel: true
					});
				} else {
					this.conversationView.addMessage({
						role: 'assistant',
						content: `Error: ${result.error ?? 'unknown error'}`
					});
				}
			}
		} catch (error: any) {
			this.logger.error('Failed to process prompt submission', error);
			try {
				this.conversationView.addMessage({
					role: 'assistant',
					content: 'An error occurred while processing your request. Please try again.'
				});
			} catch {
				// Last-resort fallback — nothing we can do
			}
		}
	}

	public mount(): void {
		if (this.container.parentElement) {
			return; // already mounted — guard against duplicates
		}

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
