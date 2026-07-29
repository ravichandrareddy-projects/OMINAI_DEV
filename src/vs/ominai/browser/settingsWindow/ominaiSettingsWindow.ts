/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, IDisposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { IInstantiationService } from '../../../platform/instantiation/common/instantiation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../platform/storage/common/storage.js';
import { ModelsSettings } from '../controlCenter/settings/modelsSettings.js';

type SettingsCategory =
	| 'general' | 'account' | 'permissions'
	| 'notifications' | 'models'
	| 'browser' | 'tab' | 'editor' | 'workspace' | 'labs';

interface ICategory {
	id: SettingsCategory;
	label: string;
	icon: string;
}

const CATEGORIES: ICategory[] = [
	{ id: 'general', label: 'General', icon: 'codicon-settings-gear' },
	{ id: 'account', label: 'Account', icon: 'codicon-account' },
	{ id: 'permissions', label: 'Permissions', icon: 'codicon-shield' },
	{ id: 'notifications', label: 'Notifications', icon: 'codicon-bell' },
	{ id: 'models', label: 'Models', icon: 'codicon-cloud' },
	{ id: 'browser', label: 'Browser', icon: 'codicon-globe' },
	{ id: 'tab', label: 'Tab', icon: 'codicon-window' },
	{ id: 'editor', label: 'Editor', icon: 'codicon-code' },
	{ id: 'workspace', label: 'Workspace', icon: 'codicon-folder-opened' },
	{ id: 'labs', label: 'Labs', icon: 'codicon-beaker' },
];

/**
 * OminaiSettingsWindow — full-screen settings overlay.
 *
 * Left sidebar nav + rich main content area with proper toggles,
 * dropdowns, and live state that persists for the window's lifetime
 * (and persists to IStorageService for cross-session durability).
 */
export class OminaiSettingsWindow extends Disposable {
	private readonly backdrop: HTMLElement;
	private readonly window: HTMLElement;
	private readonly mainContent: HTMLElement;
	private activeCategory: SettingsCategory = 'general';
	private activeCategoryView: IDisposable | undefined;

	constructor(
		private readonly parent: HTMLElement,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IStorageService private readonly storageService: IStorageService,
	) {
		super();

		// Backdrop
		this.backdrop = append(this.parent, $('div.ominai-settings-window-backdrop'));
		this._register(addDisposableListener(this.backdrop, EventType.CLICK, () => this.close()));

		// Window
		this.window = append(this.parent, $('div.ominai-settings-window'));

		// ── Title bar ──
		const titleBar = append(this.window, $('div.ominai-settings-titlebar'));
		const titleText = append(titleBar, $('span.ominai-settings-titlebar-text'));
		titleText.textContent = 'Settings';
		const closeBtn = append(titleBar, $('button.ominai-settings-titlebar-close'));
		append(closeBtn, $('span.codicon.codicon-close'));
		this._register(addDisposableListener(closeBtn, EventType.CLICK, () => this.close()));

		// ── Body ──
		const body = append(this.window, $('div.ominai-settings-window-body'));

		// Left sidebar
		const sidebar = append(body, $('div.ominai-settings-sidebar'));
		this._buildSidebar(sidebar);

		// Main content
		this.mainContent = append(body, $('div.ominai-settings-main'));
		this._openCategory(this.activeCategory, titleText);
	}

	private _buildSidebar(sidebar: HTMLElement): void {
		// Main categories
		const sectionTitle = append(sidebar, $('div.ominai-settings-sidebar-section-title'));
		sectionTitle.textContent = 'Settings';

		for (const cat of CATEGORIES) {
			const btn = append(sidebar, $('button.ominai-settings-sidebar-btn'));
			btn.dataset.catId = cat.id;
			if (cat.id === this.activeCategory) btn.classList.add('active');

			append(btn, $(`span.codicon.${cat.icon}`));
			append(btn, $('span.ominai-settings-sidebar-label')).textContent = cat.label;

			this._register(addDisposableListener(btn, EventType.CLICK, () => {
				this._setActiveSidebarBtn(cat.id);
				this._openCategory(cat.id, document.querySelector('.ominai-settings-titlebar-text') as HTMLElement);
			}));
		}
	}

	private _setActiveSidebarBtn(catId: SettingsCategory): void {
		this.activeCategory = catId;
		const allBtns = this.window.querySelectorAll('.ominai-settings-sidebar-btn');
		for (const btn of allBtns) {
			const el = btn as HTMLElement;
			el.classList.toggle('active', el.dataset.catId === catId);
		}
	}

	private _openCategory(catId: SettingsCategory, titleEl: HTMLElement | null): void {
		if (this.activeCategoryView) {
			this.activeCategoryView.dispose();
			this.activeCategoryView = undefined;
		}
		this.mainContent.textContent = '';

		if (titleEl) {
			const cat = CATEGORIES.find(c => c.id === catId);
			titleEl.textContent = `Settings${cat ? ' · ' + cat.label : ''}`;
		}

		switch (catId) {
			case 'permissions': this.activeCategoryView = this._buildPermissions(this.mainContent); break;
			case 'models': this.activeCategoryView = this._register(this.instantiationService.createInstance(ModelsSettings, this.mainContent)); break;
			case 'general': this.activeCategoryView = this._buildGeneral(this.mainContent); break;
			case 'account': this.activeCategoryView = this._buildAccount(this.mainContent); break;
			case 'notifications': this.activeCategoryView = this._buildNotifications(this.mainContent); break;
			case 'browser': this.activeCategoryView = this._buildBrowser(this.mainContent); break;
			case 'tab': this.activeCategoryView = this._buildTab(this.mainContent); break;
			case 'editor': this.activeCategoryView = this._buildEditor(this.mainContent); break;
			case 'workspace': this.activeCategoryView = this._buildWorkspace(this.mainContent); break;
			case 'labs': this.activeCategoryView = this._buildLabs(this.mainContent); break;
		}
	}

	// ── Helpers for storage-backed settings ──
	private getSetting(key: string, fallback: boolean): boolean {
		return this.storageService.getBoolean(key, StorageScope.WORKSPACE, fallback);
	}
	private setSetting(key: string, value: boolean): void {
		this.storageService.store(key, value, StorageScope.WORKSPACE, StorageTarget.USER);
	}
	private getStringSetting(key: string, fallback: string): string {
		return this.storageService.get(key, StorageScope.WORKSPACE, fallback);
	}
	private setStringSetting(key: string, value: string): void {
		this.storageService.store(key, value, StorageScope.WORKSPACE, StorageTarget.USER);
	}

	// ── General ──────────────────────────────────────────────────────────────
	private _buildGeneral(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'General Settings', 'Configure the core behavior of OMINAI.');
		this._dropdown(scroll, 'Language', 'Interface language.',
			['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Japanese', 'Chinese (Simplified)'],
			this.getStringSetting('general.language', 'English (US)'));
		this._toggleStorage(scroll, 'Compact Mode', 'Reduce UI density for more information density.', 'general.compact', false);
		this._toggleStorage(scroll, 'Animations', 'Enable smooth micro-animations throughout the UI.', 'general.animations', true);
		this._toggleStorage(scroll, 'Restore Last Session', 'Automatically restore the last conversation on startup.', 'general.restoreSession', true);
		this._dropdown(scroll, 'Workspace Layout', 'Default panel layout.',
			['Default', 'Wide Chat', 'Compact', 'Focus Mode'],
			this.getStringSetting('general.layout', 'Default'));

		return this._noopDisposable();
	}

	// ── Account ──────────────────────────────────────────────────────────────
	private _buildAccount(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Account', 'Manage your account and API credentials.');

		// Profile card
		const profileCard = append(scroll, $('div.ominai-settings-profile-card'));
		const avatar = append(profileCard, $('div.ominai-settings-avatar'));
		avatar.textContent = 'U';
		const profileInfo = append(profileCard, $('div.ominai-settings-profile-info'));
		append(profileInfo, $('div.ominai-settings-profile-name')).textContent = 'User';
		append(profileInfo, $('div.ominai-settings-profile-email')).textContent = 'user@email.com';
		const editBtn = append(profileCard, $('button.ominai-settings-profile-edit'));
		editBtn.textContent = 'Edit Profile';

		this._sectionDivider(scroll, 'API Keys');
		this._apiKey(scroll, 'OpenAI', 'sk-...');
		this._apiKey(scroll, 'Anthropic', 'sk-ant-...');
		this._apiKey(scroll, 'Google Gemini', '...');
		this._apiKey(scroll, 'Perplexity', 'pplx-...');

		const addKeyBtn = append(scroll, $('button.ominai-settings-add-key-btn'));
		append(addKeyBtn, $('span.codicon.codicon-add'));
		append(addKeyBtn, $('span')).textContent = 'Add API Key';

		return this._noopDisposable();
	}

	// ── Permissions ──────────────────────────────────────────────────────────
	private _buildPermissions(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Agent security mode', 'Select one of the three options. Agent settings and permissions can be further customized below.');

		const cards = append(scroll, $('div.ominai-permissions-cards'));

		const savedMode = this.getStringSetting('permissions.mode', 'full');
		const modes = [
			{ id: 'full', label: 'Full access', desc: 'Agents have full access to your machine and external resources.' },
			{ id: 'sandboxed', label: 'Sandboxed', desc: 'Agents run in a secure sandbox that restricts access to external resources outside of your trusted folders.' },
			{ id: 'strict', label: 'Strict', desc: 'Terminal commands always require review and the agent cannot access files outside of its given workspaces.' },
		];
		const cardEls: Map<string, HTMLElement> = new Map();

		for (const mode of modes) {
			const card = append(cards, $('div.ominai-permissions-card'));
			if (mode.id === savedMode) card.classList.add('active');
			cardEls.set(mode.id, card);
			append(card, $('div.ominai-permissions-card-title')).textContent = mode.label;
			append(card, $('div.ominai-permissions-card-desc')).textContent = mode.desc;

			this._register(addDisposableListener(card, EventType.CLICK, () => {
				for (const [id, el] of cardEls) {
					el.classList.toggle('active', id === mode.id);
				}
				// Store mode ID as string — consistent read/write type
				this.setStringSetting('permissions.mode', mode.id);
			}));
		}

		// Terminal section
		this._sectionDivider(scroll, 'Terminal');
		this._dropdown(scroll, 'Terminal Command Auto Execution',
			'Controls whether terminal commands require your approval before running.',
			['Always Proceed', 'Ask Every Time', 'Never'], 'Ask Every Time');
		this._toggleStorage(scroll, 'Enable Shell Integration',
			'When enabled, Agent will use IDE\'s shell integration to detect and report terminal command execution.',
			'permissions.shellIntegration', true);

		// File Access
		this._sectionDivider(scroll, 'File Access');
		this._toggleStorage(scroll, 'Agent Non-Workspace File Access',
			'Allows the agent to access files outside of your current workspace.',
			'permissions.nonWorkspaceAccess', true);
		this._toggleStorage(scroll, 'Auto-Open Edited Files',
			'Open files in the background if Agent creates or edits them.',
			'permissions.autoOpenFiles', true);

		// Planning
		this._sectionDivider(scroll, 'Planning');
		this._toggleStorage(scroll, 'Enable Planning Mode',
			'Agent plans before executing complex tasks for better accuracy.',
			'permissions.planning', true);
		this._toggleStorage(scroll, 'Show Execution Graph',
			'Display the task dependency graph during planning.',
			'permissions.execGraph', false);

		// Network
		this._sectionDivider(scroll, 'Network');
		this._toggleStorage(scroll, 'Allow Network Requests',
			'Agent can make HTTP/HTTPS requests to external APIs.',
			'permissions.networkRequests', true);
		this._toggleStorage(scroll, 'Allow Browser Automation',
			'Agent can control a browser instance for web tasks.',
			'permissions.browserAutomation', true);

		return this._noopDisposable();
	}

	// ── Appearance ───────────────────────────────────────────────────────────
	private _buildAppearance(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Appearance', 'Customize the look and feel of OMINAI.');
		this._dropdown(scroll, 'Theme', 'Color theme for the OMINAI panel.',
			['Follow VS Code', 'Dark (OMINAI)', 'Light (OMINAI)', 'High Contrast'],
			this.getStringSetting('appearance.theme', 'Follow VS Code'));
		this._dropdown(scroll, 'Font Size', 'UI font size.',
			['Small (12px)', 'Default (13px)', 'Large (14px)', 'Extra Large (16px)'],
			this.getStringSetting('appearance.fontSize', 'Default (13px)'));
		this._dropdown(scroll, 'Font Family', 'UI font family.',
			['System Default', 'Inter', 'Roboto', 'JetBrains Mono', 'Fira Code'],
			this.getStringSetting('appearance.fontFamily', 'System Default'));
		this._toggleStorage(scroll, 'Show Provider Icons',
			'Display model provider icons in the chat.',
			'appearance.providerIcons', true);
		this._toggleStorage(scroll, 'Show Timestamps',
			'Show message timestamps in conversation view.',
			'appearance.timestamps', false);
		this._toggleStorage(scroll, 'Blur Sensitive Data',
			'Blur API keys and tokens in the UI.',
			'appearance.blurSensitive', true);

		return this._noopDisposable();
	}

	// ── Notifications ────────────────────────────────────────────────────────
	private _buildNotifications(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Notifications', 'Control when and how OMINAI notifies you.');
		this._toggleStorage(scroll, 'Task Completed', 'Notify when a long-running task finishes.', 'notif.taskCompleted', true);
		this._toggleStorage(scroll, 'Task Failed', 'Notify when a task encounters an error.', 'notif.taskFailed', true);
		this._toggleStorage(scroll, 'Browser Action Required', 'Notify when browser automation needs your input.', 'notif.browserAction', true);
		this._toggleStorage(scroll, 'Provider Disconnected', 'Alert when a configured AI provider goes offline.', 'notif.providerDisconnected', false);
		this._toggleStorage(scroll, 'Sound Effects', 'Play sounds for completion and error events.', 'notif.sound', false);

		return this._noopDisposable();
	}

	// ── Customizations ───────────────────────────────────────────────────────
	private _buildCustomizations(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Customizations', 'Personalize OMINAI\'s behavior and personality.');

		this._sectionDivider(scroll, 'Custom Instructions');
		const textarea = append(scroll, $('textarea.ominai-settings-textarea')) as HTMLTextAreaElement;
		textarea.placeholder = 'Tell OMINAI about yourself, your preferences, or any specific instructions you want it to follow in every conversation...';
		textarea.rows = 6;

		this._sectionDivider(scroll, 'Agent Persona');
		this._dropdown(scroll, 'Communication Style', 'How OMINAI phrases its responses.',
			['Professional', 'Casual', 'Concise', 'Detailed', 'Teaching'],
			this.getStringSetting('custom.style', 'Professional'));
		this._toggleStorage(scroll, 'Proactive Suggestions', 'Allow OMINAI to suggest improvements unprompted.', 'custom.proactive', true);
		this._toggleStorage(scroll, 'Code Explanations', 'Always explain code changes in plain language.', 'custom.codeExplanations', true);

		return this._noopDisposable();
	}

	// ── Browser ──────────────────────────────────────────────────────────────
	private _buildBrowser(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Browser', 'Configure browser automation behavior.');
		this._dropdown(scroll, 'Default Browser', 'Browser to use for automation.',
			['Chromium (Built-in)', 'Chrome', 'Firefox', 'Edge'],
			this.getStringSetting('browser.default', 'Chromium (Built-in)'));
		this._toggleStorage(scroll, 'Headless Mode', 'Run browser in background without showing a window.', 'browser.headless', false);
		this._toggleStorage(scroll, 'Screenshot on Action', 'Capture screenshots for every browser interaction.', 'browser.screenshots', true);
		this._toggleStorage(scroll, 'Block Ads', 'Block advertisements during browser automation.', 'browser.blockAds', true);
		this._dropdown(scroll, 'Default Timeout', 'Max wait time per page action.',
			['10 seconds', '15 seconds', '30 seconds', '60 seconds'],
			this.getStringSetting('browser.timeout', '30 seconds'));

		return this._noopDisposable();
	}

	// ── Tab ──────────────────────────────────────────────────────────────────
	private _buildTab(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Tab', 'Configure the OMINAI tab and panel behavior.');
		this._toggleStorage(scroll, 'Auto-Open on Task Start', 'Automatically open OMINAI panel when a task begins.', 'tab.autoOpen', true);
		this._toggleStorage(scroll, 'Remember Panel Size', 'Persist the right panel width between sessions.', 'tab.rememberSize', true);
		this._dropdown(scroll, 'Default Tab', 'Which tab to show when the panel opens.',
			['Workspace', 'Activity', 'History', 'Settings'],
			this.getStringSetting('tab.defaultTab', 'Workspace'));
		this._toggleStorage(scroll, 'Show Activity Badge', 'Show a count badge on the Activity tab.', 'tab.activityBadge', true);

		return this._noopDisposable();
	}

	// ── Editor ───────────────────────────────────────────────────────────────
	private _buildEditor(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Editor Integration', 'Control how OMINAI interacts with the code editor.');
		this._toggleStorage(scroll, 'Inline Code Suggestions', 'Show inline completions as you type.', 'editor.inlineSuggestions', true);
		this._toggleStorage(scroll, 'Auto-Apply Edits', 'Apply suggested code edits without confirmation.', 'editor.autoApply', false);
		this._toggleStorage(scroll, 'Show Diff on Edit', 'Show a diff view when OMINAI modifies files.', 'editor.showDiff', true);
		this._toggleStorage(scroll, 'Highlight Changed Lines', 'Highlight lines modified by OMINAI in the gutter.', 'editor.highlightChanges', true);
		this._dropdown(scroll, 'Context Window Strategy', 'How OMINAI selects code to include as context.',
			['Smart (Recommended)', 'Full File', 'Selection Only', 'Workspace-wide'],
			this.getStringSetting('editor.contextStrategy', 'Smart (Recommended)'));

		return this._noopDisposable();
	}

	// ── Workspace ────────────────────────────────────────────────────────────
	private _buildWorkspace(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Workspace', 'Workspace management and project preferences.');

		this._sectionDivider(scroll, 'Project Indexing');
		this._toggleStorage(scroll, 'Enable Project Indexing', 'Index project files for improved code awareness.', 'workspace.indexing', true);
		this._toggleStorage(scroll, 'Auto Refresh Index', 'Automatically refresh the project index on file changes.', 'workspace.autoRefresh', true);

		this._sectionDivider(scroll, 'Ignored Paths');
		const ignoreInput = append(scroll, $('input.ominai-settings-text-input')) as HTMLInputElement;
		ignoreInput.value = 'node_modules, .git, dist, out, build';
		ignoreInput.placeholder = 'Comma-separated folder names to ignore';

		this._sectionDivider(scroll, 'Memory & Storage');
		this._toggleStorage(scroll, 'Workspace Memory', 'Remember context about your project between sessions.', 'workspace.memory', true);
		this._toggleStorage(scroll, 'Git Integration', 'Enable git-aware features (blame, diff, commit messages).', 'workspace.git', true);
		this._toggleStorage(scroll, 'Patch Preview', 'Preview suggested changes before applying.', 'workspace.patchPreview', true);

		return this._noopDisposable();
	}

	// ── Labs ─────────────────────────────────────────────────────────────────
	private _buildLabs(container: HTMLElement): IDisposable {
		const scroll = append(container, $('div.ominai-settings-content-scroll'));

		this._section(scroll, 'Labs', 'Experimental features. These may change or be removed.');

		this._labsFeature(scroll, 'codicon-mic', 'Voice Input & Output',
			'Send voice messages and receive spoken responses.', false);
		this._labsFeature(scroll, 'codicon-device-camera', 'Vision & Screen Understanding',
			'Agent can see your screen, read images, and understand diagrams.', false);
		this._labsFeature(scroll, 'codicon-plug', 'Model Context Protocol (MCP)',
			'Connect custom tools and data sources via the MCP standard.', false);
		this._labsFeature(scroll, 'codicon-robot', 'Autonomous Agent Mode',
			'Agents can execute multi-step tasks with full autonomy.', false);
		this._labsFeature(scroll, 'codicon-extensions', 'Custom Tool Integrations',
			'Build and integrate your own custom tools.', false);

		return this._noopDisposable();
	}

	// ── Helpers ──────────────────────────────────────────────────────────────

	private _noopDisposable(): IDisposable {
		return { dispose: () => { } };
	}

	private _section(container: HTMLElement, title: string, subtitle?: string): void {
		const s = append(container, $('div.ominai-settings-section-header'));
		append(s, $('div.ominai-settings-section-title')).textContent = title;
		if (subtitle) {
			append(s, $('div.ominai-settings-section-sub')).textContent = subtitle;
		}
	}

	private _sectionDivider(container: HTMLElement, label: string): void {
		append(container, $('div.ominai-settings-divider')).textContent = label;
	}

	// _toggle was replaced by _toggleStorage() — see _createToggleRow above

	private _toggleStorage(container: HTMLElement, title: string, desc: string, storageKey: string, defaultOn: boolean): void {
		const row = append(container, $('div.ominai-settings-row-item'));
		const left = append(row, $('div.ominai-settings-row-item-left'));
		append(left, $('div.ominai-settings-row-item-title')).textContent = title;
		append(left, $('div.ominai-settings-row-item-desc')).textContent = desc;

		let on = this.getSetting(storageKey, defaultOn);
		const toggle = append(row, $('button.ominai-toggle'));
		if (on) toggle.classList.add('on');

		append(toggle, $('span.ominai-toggle-thumb'));

		this._register(addDisposableListener(toggle, EventType.CLICK, () => {
			on = !on;
			toggle.classList.toggle('on', on);
			this.setSetting(storageKey, on);
		}));
	}

	private _dropdown(container: HTMLElement, title: string, desc: string, options: string[], selected: string): void {
		const row = append(container, $('div.ominai-settings-row-item'));
		const left = append(row, $('div.ominai-settings-row-item-left'));
		append(left, $('div.ominai-settings-row-item-title')).textContent = title;
		append(left, $('div.ominai-settings-row-item-desc')).textContent = desc;

		const select = append(row, $('select.ominai-settings-select')) as HTMLSelectElement;
		for (const opt of options) {
			const o = append(select, $('option')) as HTMLOptionElement;
			o.value = opt;
			o.textContent = opt;
			if (opt === selected) {
				o.selected = true;
			}
		}
	}

	private _apiKey(container: HTMLElement, provider: string, masked: string): void {
		const row = append(container, $('div.ominai-settings-api-key-row'));
		append(row, $('div.ominai-settings-api-key-label')).textContent = provider;

		const input = append(row, $('input.ominai-settings-api-key-input')) as HTMLInputElement;
		input.type = 'password';
		input.value = masked;
		input.placeholder = 'Enter API key...';
		input.readOnly = true;

		const editBtn = append(row, $('button.ominai-settings-api-key-edit'));
		append(editBtn, $('span.codicon.codicon-edit'));

		this._register(addDisposableListener(editBtn, EventType.CLICK, () => {
			input.readOnly = !input.readOnly;
			if (!input.readOnly) {
				input.type = 'text';
				// Keep existing value so user can see/modify it
				input.focus();
				editBtn.title = 'Lock';
			} else {
				input.type = 'password';
				editBtn.title = 'Edit';
			}
		}));
	}

	private _labsFeature(container: HTMLElement, icon: string, name: string, desc: string, enabled: boolean): void {
		const row = append(container, $('div.ominai-settings-row-item'));
		const left = append(row, $('div.ominai-settings-row-item-left'));

		const titleRow = append(left, $('div.ominai-settings-row-item-title-labs'));
		append(titleRow, $(`span.codicon.${icon}.ominai-labs-icon`));
		append(titleRow, $('span.ominai-settings-row-item-title')).textContent = name;
		append(titleRow, $('span.ominai-labs-coming-soon')).textContent = 'Coming Soon';

		append(left, $('div.ominai-settings-row-item-desc')).textContent = desc;

		const toggle = append(row, $('button.ominai-toggle'));
		if (enabled) toggle.classList.add('on');
		toggle.classList.add('labs-toggle');
		append(toggle, $('span.ominai-toggle-thumb'));
	}

	public close(): void {
		this.dispose();
	}

	public override dispose(): void {
		this.backdrop.remove();
		this.window.remove();
		super.dispose();
	}
}
