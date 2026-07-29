/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../../base/browser/dom.js';
import { IOminaiProviderService, ITaskRole, IOminaiProvider } from '../../../common/ominaiServices.js';

/**
 * ModelsSettings — Task Role Assignment panel.
 *
 * Each task (Architecture, Coding, Reasoning, etc.) can have multiple
 * AI models assigned. The user can add or remove models per task,
 * and star one as the primary. OMINAI engine routes accordingly.
 */
export class ModelsSettings extends Disposable {

	private expandedRole: string | null = null;

	constructor(
		private readonly container: HTMLElement,
		@IOminaiProviderService private readonly providerService: IOminaiProviderService
	) {
		super();
		this.container.classList.add('ominai-models-settings');
		this._render();

		this._register(this.providerService.onDidChangeRoleAssignments(() => {
			this._render();
		}));
	}

	private _render(): void {
		this.container.textContent = '';

		// Header
		const header = append(this.container, $('div.ominai-models-header'));
		const headerIcon = append(header, $('span.ominai-models-header-icon'));
		headerIcon.textContent = '🤖';
		const headerText = append(header, $('div.ominai-models-header-text'));
		append(headerText, $('div.ominai-models-header-title')).textContent = 'AI Model Roles';
		append(headerText, $('div.ominai-models-header-sub')).textContent = 'Assign AI models for each task type. OMINAI routes to the right model automatically.';

		// Task roles list
		const list = append(this.container, $('div.ominai-role-list'));

		for (const role of this.providerService.getTaskRoles()) {
			this._renderRoleRow(list, role);
		}
	}

	private _renderRoleRow(parent: HTMLElement, role: ITaskRole): void {
		const assignedIds = this.providerService.getRoleAssignment(role.id);
		const primaryProvider = this.providerService.getPrimaryProviderForRole(role.id);
		const assignedProviders = assignedIds
			.map(id => this.providerService.getProviders().find(p => p.id === id))
			.filter(Boolean) as IOminaiProvider[];

		const isExpanded = this.expandedRole === role.id;

		const row = append(parent, $('div.ominai-role-row'));
		if (isExpanded) row.classList.add('expanded');

		// ── Row Header ──
		const rowHeader = append(row, $('div.ominai-role-row-header'));

		// Left: icon + label + description
		const left = append(rowHeader, $('div.ominai-role-row-left'));
		append(left, $('span.ominai-role-icon')).textContent = role.icon;
		const labelGroup = append(left, $('div.ominai-role-label-group'));
		append(labelGroup, $('div.ominai-role-label')).textContent = role.label;
		append(labelGroup, $('div.ominai-role-desc')).textContent = role.description;

		// Middle: assigned model chips
		const chips = append(rowHeader, $('div.ominai-role-chips'));
		if (assignedProviders.length === 0) {
			const empty = append(chips, $('span.ominai-role-chip-empty'));
			empty.textContent = 'No model assigned';
		} else {
			for (const p of assignedProviders) {
				const chip = append(chips, $('span.ominai-role-chip'));
				if (p.id === primaryProvider?.id) {
					chip.classList.add('primary');
					chip.title = 'Primary model for this role';
				}
				chip.textContent = p.name;
			}
		}

		// Right: expand/collapse + add button
		const right = append(rowHeader, $('div.ominai-role-row-right'));
		const addBtn = append(right, $('button.ominai-role-add-btn'));
		addBtn.title = 'Configure models for this role';
		append(addBtn, $('span.codicon.codicon-settings-gear'));

		this._register(addDisposableListener(addBtn, EventType.CLICK, (e) => {
			e.stopPropagation();
			this.expandedRole = isExpanded ? null : role.id;
			this._render();
		}));

		this._register(addDisposableListener(rowHeader, EventType.CLICK, () => {
			this.expandedRole = isExpanded ? null : role.id;
			this._render();
		}));

		// ── Expanded panel ──
		if (isExpanded) {
			this._renderExpandedPanel(row, role, assignedIds, primaryProvider);
		}
	}

	private _renderExpandedPanel(parent: HTMLElement, role: ITaskRole, assignedIds: string[], primaryProvider: IOminaiProvider | undefined): void {
		const panel = append(parent, $('div.ominai-role-panel'));

		// Section: Assigned Models
		append(panel, $('div.ominai-role-panel-section-title')).textContent = 'ASSIGNED MODELS';

		const assignedSection = append(panel, $('div.ominai-role-assigned-list'));

		if (assignedIds.length === 0) {
			const empty = append(assignedSection, $('div.ominai-role-panel-empty'));
			empty.textContent = 'No models assigned yet. Add one below.';
		}

		for (const id of assignedIds) {
			const provider = this.providerService.getProviders().find(p => p.id === id);
			if (!provider) continue;

			const item = append(assignedSection, $('div.ominai-role-assigned-item'));

			// Star / Primary indicator
			const starBtn = append(item, $('button.ominai-role-star-btn'));
			starBtn.title = provider.id === primaryProvider?.id ? 'Primary model' : 'Set as primary';
			if (provider.id === primaryProvider?.id) {
				append(starBtn, $('span.codicon.codicon-star-full'));
				starBtn.classList.add('active');
			} else {
				append(starBtn, $('span.codicon.codicon-star-empty'));
			}

			this._register(addDisposableListener(starBtn, EventType.CLICK, (e) => {
				e.stopPropagation();
				this.providerService.setPrimaryProviderForRole(role.id, provider.id);
			}));

			// Name + tier badge
			const nameGroup = append(item, $('div.ominai-role-assigned-name-group'));
			append(nameGroup, $('span.ominai-role-assigned-name')).textContent = provider.name;
			const tierBadge = append(nameGroup, $('span.ominai-role-tier-badge'));
			tierBadge.textContent = provider.tier;
			tierBadge.classList.add(`tier-${provider.tier}`);

			// Caps
			const caps = append(item, $('div.ominai-role-caps'));
			if (provider.supportsVision) this._addCap(caps, 'codicon-eye', 'Vision');
			if (provider.supportsTools) this._addCap(caps, 'codicon-tools', 'Tools');

			// Remove
			const removeBtn = append(item, $('button.ominai-role-remove-btn'));
			removeBtn.title = 'Remove from this role';
			append(removeBtn, $('span.codicon.codicon-close'));

			this._register(addDisposableListener(removeBtn, EventType.CLICK, (e) => {
				e.stopPropagation();
				this.providerService.removeProviderFromRole(role.id, provider.id);
			}));
		}

		// Section: Add Models
		append(panel, $('div.ominai-role-panel-section-title')).textContent = 'ADD MODEL';

		const allProviders = this.providerService.getProviders();
		const availableProviders = allProviders.filter(p => !assignedIds.includes(p.id));

		if (availableProviders.length === 0) {
			append(panel, $('div.ominai-role-panel-empty')).textContent = 'All models are already assigned to this role.';
			return;
		}

		// Search input
		const searchWrapper = append(panel, $('div.ominai-role-search-wrapper'));
		append(searchWrapper, $('span.codicon.codicon-search'));
		const searchInput = append(searchWrapper, $('input.ominai-role-search-input')) as HTMLInputElement;
		searchInput.placeholder = 'Search models to add...';

		const pickerList = append(panel, $('div.ominai-role-picker-list'));
		this._renderPickerList(pickerList, availableProviders, role.id, assignedIds);

		this._register(addDisposableListener(searchInput, EventType.INPUT, () => {
			const query = searchInput.value.toLowerCase();
			const filtered = availableProviders.filter(p =>
				p.name.toLowerCase().includes(query) ||
				(p.description ?? '').toLowerCase().includes(query)
			);
			this._renderPickerList(pickerList, filtered, role.id, assignedIds);
		}));
	}

	private _renderPickerList(container: HTMLElement, providers: IOminaiProvider[], roleId: string, assignedIds: string[]): void {
		container.textContent = '';
		if (providers.length === 0) {
			append(container, $('div.ominai-role-panel-empty')).textContent = 'No matching models found.';
			return;
		}

		for (const p of providers) {
			const item = append(container, $('div.ominai-role-picker-item'));

			const left = append(item, $('div.ominai-role-picker-left'));
			append(left, $('div.ominai-role-picker-name')).textContent = p.name;
			append(left, $('div.ominai-role-picker-desc')).textContent = p.description ?? '';

			const addBtn = append(item, $('button.ominai-role-picker-add'));
			append(addBtn, $('span.codicon.codicon-add'));
			append(addBtn, $('span')).textContent = 'Add';

			this._register(addDisposableListener(addBtn, EventType.CLICK, (e) => {
				e.stopPropagation();
				this.providerService.assignProviderToRole(roleId, p.id);
			}));
		}
	}

	private _addCap(parent: HTMLElement, icon: string, label: string): void {
		const cap = append(parent, $('span.ominai-role-cap'));
		append(cap, $(`span.codicon.${icon}`));
		append(cap, $('span')).textContent = label;
	}
}
