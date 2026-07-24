/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';

import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import './media/ominaiView.css';
import { Codicon } from '../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { $, append } from '../../../../base/browser/dom.js';

export interface IDummyModeViewOptions extends IViewletViewOptions {
	dummyMessage: string;
}

const ominaiIcon = registerIcon('ominai-logo', Codicon.activateBreakpoints, 'OMINAI Logo');

export class OminaiViewPane extends ViewPane {

	constructor(
		options: IDummyModeViewOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
	) {
		super(options as IViewPaneOptions, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);
		
		const root = append(container, $('div.ominai-view-pane'));

		// --- Header ---
		const header = append(root, $('div.ominai-header'));
		
		const titleRow = append(header, $('div.ominai-header-title'));
		append(titleRow, $(`span.ominai-header-icon${ThemeIcon.asCSSSelector(ominaiIcon)}`));
		const titleText = append(titleRow, $('div.ominai-header-text'));
		const titleH2 = append(titleText, $('h2'));
		titleH2.textContent = 'OMINAI';
		const titleP = append(titleText, $('p'));
		titleP.textContent = 'AI Engineer Operating';

		const statusGrid = append(header, $('div.ominai-status-grid'));
		
		// Status Item
		const statusItem = append(statusGrid, $('div.ominai-status-item'));
		const statusLabel = append(statusItem, $('div.ominai-status-label'));
		statusLabel.textContent = 'Status';
		const statusValue = append(statusItem, $('div.ominai-status-value'));
		statusValue.textContent = 'Ready';

		// Mode Item
		const modeItem = append(statusGrid, $('div.ominai-status-item'));
		const modeLabel = append(modeItem, $('div.ominai-status-label'));
		modeLabel.textContent = 'Mode';
		const modeValue = append(modeItem, $('div.ominai-status-value'));
		append(modeValue, $('div.ominai-status-dot.purple'));
		const modeText = append(modeValue, $('span'));
		modeText.textContent = 'OMINAI';

		// Computer Access Item
		const accessItem = append(statusGrid, $('div.ominai-status-item'));
		const accessLabel = append(accessItem, $('div.ominai-status-label'));
		accessLabel.textContent = 'Computer Access';
		const accessValue = append(accessItem, $('div.ominai-status-value'));
		const accessValueText = append(accessValue, $('span'));
		// Read from config service
		const accessConfig = this.configurationService.getValue<string>('omini.computerAccess') || 'Workspace Control';
		accessValueText.textContent = accessConfig;

		// Provider Item
		const providerItem = append(statusGrid, $('div.ominai-status-item'));
		const providerLabel = append(providerItem, $('div.ominai-status-label'));
		providerLabel.textContent = 'Provider';
		const providerValue = append(providerItem, $('div.ominai-status-value'));
		append(providerValue, $('div.ominai-status-dot.green'));
		const providerText = append(providerValue, $('span'));
		providerText.textContent = 'Claude (Browser)';
		append(providerValue, $(`span${ThemeIcon.asCSSSelector(Codicon.globe)}`));

		// Browser Status Item
		const browserStatusItem = append(statusGrid, $('div.ominai-status-item'));
		const browserStatusLabel = append(browserStatusItem, $('div.ominai-status-label'));
		browserStatusLabel.textContent = 'Browser Status';
		const browserStatusValue = append(browserStatusItem, $('div.ominai-status-value'));
		append(browserStatusValue, $('div.ominai-status-dot.yellow'));
		const browserStatusText = append(browserStatusValue, $('span'));
		browserStatusText.textContent = 'Idle';

		// --- Tabs ---
		const tabs = append(root, $('div.ominai-tabs'));
		const tabNames = ['CHAT', 'EXECUTION', 'FILES', 'BROWSER', 'GITHUB', 'DEBUG', 'TERMINAL', 'SETTINGS'];
		for (let i = 0; i < tabNames.length; i++) {
			const tab = append(tabs, $('div.ominai-tab'));
			tab.textContent = tabNames[i];
			if (i === 0) {
				tab.classList.add('active');
			}
		}

		// --- Chat Timeline ---
		const timeline = append(root, $('div.ominai-timeline-container'));

		// User Message Bubble
		const userBubble = append(timeline, $('div.ominai-chat-bubble.user'));
		const userHeader = append(userBubble, $('div.chat-header'));
		const userName = append(userHeader, $('span'));
		userName.textContent = 'You';
		const userTime = append(userHeader, $('span.chat-time'));
		userTime.textContent = '20:22';
		const userText = append(userBubble, $('div.chat-text'));
		userText.textContent = 'Build a Flutter authentication screen with email login and Google sign in.';

		// Agent Timeline Container
		const agentTimeline = append(timeline, $('div.ominai-agent-timeline'));
		
		const agentHeader = append(agentTimeline, $('div.ominai-agent-header'));
		append(agentHeader, $(`span.icon${ThemeIcon.asCSSSelector(ominaiIcon)}`));
		const agentName = append(agentHeader, $('span'));
		agentName.textContent = 'OMINAI';

		// Timeline Item: Planning
		const planItem = append(agentTimeline, $('div.ominai-timeline-item'));
		append(planItem, $(`span.ominai-timeline-icon.success${ThemeIcon.asCSSSelector(Codicon.check)}`));
		const planContent = append(planItem, $('div.ominai-timeline-content'));
		const planHeader = append(planContent, $('div.ominai-chat-bubble.user .chat-header'));
		planHeader.style.marginBottom = '0';
		const planText = append(planHeader, $('span.ominai-timeline-text'));
		planText.textContent = 'Planning the implementation...';
		const planTime = append(planHeader, $('span.chat-time'));
		planTime.textContent = '20:22';

		// Timeline Item: Browser
		const browserItem = append(agentTimeline, $('div.ominai-timeline-item'));
		append(browserItem, $(`span.ominai-timeline-icon.running${ThemeIcon.asCSSSelector(Codicon.sync)}`)); // Or a circle
		const browserContent = append(browserItem, $('div.ominai-timeline-content'));
		const browserBlock = append(browserContent, $('div.ominai-timeline-block'));
		const browserBlockLeft = append(browserBlock, $('div'));
		const browserBlockTitle = append(browserBlockLeft, $('div.ominai-timeline-text'));
		browserBlockTitle.textContent = 'Opening browser to Claude...';
		browserBlockTitle.style.color = '#58a6ff';
		const browserBlockSub = append(browserBlockLeft, $('div.ominai-timeline-subtext'));
		browserBlockSub.textContent = 'chat.anthropic.com';
		const browserTime = append(browserBlock, $('span.chat-time'));
		browserTime.textContent = '20:22';
		
		// More mock items
		const mockTasks = [
			{ title: 'Analyzing response...', time: '20:23', type: 'pending' },
			{ title: 'Creating Flutter files...', time: '20:23', type: 'pending' },
			{ title: 'Writing authentication UI...', time: '20:24', type: 'pending' },
			{ title: 'Integrating Google Sign In...', time: '20:24', type: 'pending' },
			{ title: 'Running & verifying...', time: '20:25', type: 'pending' },
			{ title: 'Task Completed Successfully', time: '20:25', type: 'success' }
		];

		for (const task of mockTasks) {
			const item = append(agentTimeline, $('div.ominai-timeline-item'));
			const icon = append(item, $(`span.ominai-timeline-icon${ThemeIcon.asCSSSelector(task.type === 'success' ? Codicon.check : Codicon.chevronRight)}`));
			if (task.type === 'success') {
				icon.classList.add('success');
			}
			const content = append(item, $('div.ominai-timeline-content'));
			const hdr = append(content, $('div.ominai-chat-bubble.user .chat-header'));
			hdr.style.marginBottom = '0';
			const text = append(hdr, $('span.ominai-timeline-text'));
			text.textContent = task.title;
			if (task.type === 'success') text.style.color = '#3fb950';
			const time = append(hdr, $('span.chat-time'));
			time.textContent = task.time;
		}


		// --- Input Box ---
		const inputContainer = append(root, $('div.ominai-input-container'));
		const inputBox = append(inputContainer, $('div.ominai-input-box'));
		
		const textarea = append(inputBox, $('textarea.ominai-input-textarea')) as HTMLTextAreaElement;
		textarea.placeholder = 'Ask OMINAI anything...';

		const actionsRow = append(inputBox, $('div.ominai-input-actions'));
		const btns = append(actionsRow, $('div.ominai-input-buttons'));
		
		const btnContext = append(btns, $('button.ominai-action-btn'));
		append(btnContext, $(`span${ThemeIcon.asCSSSelector(Codicon.mention)}`));
		append(btnContext, $('span')).textContent = 'Add Context';

		const btnAuto = append(btns, $('button.ominai-action-btn'));
		append(btnAuto, $(`span${ThemeIcon.asCSSSelector(Codicon.zap)}`));
		append(btnAuto, $('span')).textContent = 'Auto';
		append(btnAuto, $(`span${ThemeIcon.asCSSSelector(Codicon.chevronDown)}`));

		const btnAgent = append(btns, $('button.ominai-action-btn'));
		append(btnAgent, $(`span${ThemeIcon.asCSSSelector(Codicon.hubot)}`));
		append(btnAgent, $('span')).textContent = 'Agent';
		append(btnAgent, $(`span${ThemeIcon.asCSSSelector(Codicon.chevronDown)}`));

		const sendBtn = append(actionsRow, $('button.ominai-send-btn'));
		append(sendBtn, $(`span${ThemeIcon.asCSSSelector(Codicon.send)}`));
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
	}
}
