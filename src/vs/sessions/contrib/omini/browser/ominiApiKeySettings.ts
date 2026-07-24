/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/ominiApiKeySettings.css';
import { Disposable, DisposableStore, MutableDisposable } from '../../../../base/common/lifecycle.js';
import { $, append, clearNode, addDisposableListener, EventType } from '../../../../base/browser/dom.js';
import { Dialog } from '../../../../base/browser/ui/dialog/dialog.js';
import { createWorkbenchDialogOptions } from '../../../../workbench/browser/parts/dialogs/dialog.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
import { IHostService } from '../../../../workbench/services/host/browser/host.js';
import { IOMINIKeychainService, IApiProviderConfig } from '../common/ominiApiKeyConfig.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { localize } from '../../../../nls.js';

/**
 * Creates and manages the API provider configuration dialog.
 *
 * Shows a list of configured providers and a form for adding/editing them.
 */
export class OMINIApiKeySettingsDialog extends Disposable {

	private readonly _dialogRef = this._register(new MutableDisposable<DisposableStore>());
	private _isOpen = false;

	constructor(
		@IOMINIKeychainService private readonly keychainService: IOMINIKeychainService,
		@IKeybindingService private readonly keybindingService: IKeybindingService,
		@ILayoutService private readonly layoutService: ILayoutService,
		@IHostService private readonly hostService: IHostService,
	) {
		super();
	}

	get isOpen(): boolean {
		return this._isOpen;
	}

	async open(): Promise<void> {
		if (this._isOpen) {
			return;
		}
		this._isOpen = true;

		const disposables = new DisposableStore();
		this._dialogRef.value = disposables;

		const dialog = disposables.add(new Dialog(
			this.layoutService.activeContainer,
			localize('omini.apiSettings.title', "API Provider Configuration"),
			[localize('omini.apiSettings.close', "Close")],
			createWorkbenchDialogOptions({
				type: 'none',
				extraClasses: ['omini-api-settings-dialog'],
				icon: Codicon.key,
				alignment: 0, // Horizontal
				cancelId: 0,
				disableCloseAction: true,
				renderBody: container => this._renderBody(container, disposables),
			}, this.keybindingService, this.layoutService, this.hostService)
		));

		await dialog.show();
		disposables.dispose();
		this._dialogRef.clear();
		this._isOpen = false;
	}

	close(): void {
		this._dialogRef.clear();
		this._isOpen = false;
	}

	private _renderBody(container: HTMLElement, disposables: DisposableStore): void {
		container.classList.add('omini-api-settings-body');

		// ── Provider list ──
		const listSection = append(container, $('.omini-api-provider-list'));
		append(listSection, $('h4', undefined, localize('omini.apiSettings.providers', "Configured Providers")));

		const listEl = append(listSection, $('.omini-api-provider-items'));
		this._renderProviderList(listEl);

		// ── Add / edit form ──
		const formSection = append(container, $('.omini-api-provider-form'));
		append(formSection, $('h4', undefined, localize('omini.apiSettings.addProvider', "Add / Edit Provider")));

		const nameInput = this._createInput(formSection, localize('omini.apiSettings.name', "Provider Name"), 'text', 'OpenAI');
		const urlInput = this._createInput(formSection, localize('omini.apiSettings.url', "API URL"), 'text', 'https://api.openai.com/v1');
		const keyInput = this._createInput(formSection, localize('omini.apiSettings.apiKey', "API Key"), 'password', '');
		const modelInput = this._createInput(formSection, localize('omini.apiSettings.model', "Model"), 'text', 'gpt-4');

		// ── Buttons ──
		const buttonRow = append(formSection, $('.omini-api-form-buttons'));

		const saveBtn = append(buttonRow, $('button.omini-api-btn.omini-api-btn-primary'));
		saveBtn.textContent = localize('omini.apiSettings.save', "Save Provider");
		disposables.add(addDisposableListener(saveBtn, EventType.CLICK, () => {
			this._saveProvider(nameInput, urlInput, keyInput, modelInput);
			this._renderProviderList(listEl);
			this._clearForm(nameInput, urlInput, keyInput, modelInput);
		}));

		const clearBtn = append(buttonRow, $('button.omini-api-btn'));
		clearBtn.textContent = localize('omini.apiSettings.clear', "Clear Form");
		disposables.add(addDisposableListener(clearBtn, EventType.CLICK, () => {
			this._clearForm(nameInput, urlInput, keyInput, modelInput);
		}));
	}

	private _renderProviderList(container: HTMLElement): void {
		clearNode(container);
		const providers = this.keychainService.getProviders();

		if (providers.length === 0) {
			container.textContent = localize('omini.apiSettings.noProviders', "No providers configured yet.");
			container.style.opacity = '0.6';
			return;
		}
		container.style.opacity = '1';

		for (const provider of providers) {
			const row = append(container, $('.omini-api-provider-row'));

			const info = append(row, $('.omini-api-provider-info'));
			append(info, $('span.omini-api-provider-name', undefined, provider.name));
			if (provider.isActive) {
				append(info, $('span.omini-api-provider-badge', undefined, localize('omini.apiSettings.active', "ACTIVE")));
			}
			append(info, $('span.omini-api-provider-model', undefined, provider.model));

			const actions = append(row, $('.omini-api-provider-actions'));

			// Set active button
			const activateBtn = append(actions, $('button.omini-api-btn.omini-api-btn-small'));
			activateBtn.textContent = localize('omini.apiSettings.setActive', "Use");
			if (provider.isActive) {
				(activateBtn as HTMLButtonElement).disabled = true;
			}
			activateBtn.title = localize('omini.apiSettings.setActive.tooltip', "Set as active provider");
			activateBtn.addEventListener('click', () => {
				this.keychainService.setActiveProvider(provider.id);
				this._renderProviderList(container);
			});

			// Delete button
			const deleteBtn = append(actions, $('button.omini-api-btn.omini-api-btn-small.omini-api-btn-danger'));
			deleteBtn.textContent = '🗑';
			deleteBtn.title = localize('omini.apiSettings.delete.tooltip', "Delete this provider");
			deleteBtn.addEventListener('click', () => {
				this.keychainService.removeProvider(provider.id);
				this._renderProviderList(container);
			});
		}
	}

	private _createInput(container: HTMLElement, label: string, type: string, placeholder: string): HTMLInputElement {
		const wrapper = append(container, $('.omini-api-form-field'));
		append(wrapper, $('label.omini-api-form-label', undefined, label));
		const input = append(wrapper, $('input.omini-api-form-input')) as HTMLInputElement;
		input.type = type;
		input.placeholder = placeholder;
		return input;
	}

	private _saveProvider(
		nameInput: HTMLInputElement,
		urlInput: HTMLInputElement,
		keyInput: HTMLInputElement,
		modelInput: HTMLInputElement,
	): void {
		const name = nameInput.value.trim();
		const url = urlInput.value.trim();
		const key = keyInput.value.trim();
		const model = modelInput.value.trim();

		if (!name || !url || !key || !model) {
			return; // TODO: show validation feedback
		}

		const providers = this.keychainService.getProviders();
		const existing = providers.find(p => p.name === name);

		const config: IApiProviderConfig = existing
			? { ...existing, name, apiUrl: url, apiKey: key, model }
			: {
				id: generateUuid(),
				name,
				apiUrl: url,
				apiKey: key,
				model,
				isActive: providers.length === 0,
			};

		this.keychainService.saveProvider(config);
	}

	private _clearForm(
		nameInput: HTMLInputElement,
		urlInput: HTMLInputElement,
		keyInput: HTMLInputElement,
		modelInput: HTMLInputElement,
	): void {
		nameInput.value = '';
		urlInput.value = '';
		keyInput.value = '';
		modelInput.value = '';
	}
}
