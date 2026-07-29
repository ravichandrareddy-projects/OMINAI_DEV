/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, IDisposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType, hide, show } from '../../../base/browser/dom.js';
import { IOminaiProvider, IOminaiProviderService, ProviderTier } from '../../common/ominaiServices.js';
import { Event, Emitter } from '../../../base/common/event.js';

export class ModelSelectorWidget extends Disposable {
	private readonly container: HTMLElement;
	private readonly searchInput: HTMLInputElement;
	private readonly listContainer: HTMLElement;
	private isVisible: boolean = false;

	private readonly _onDidSelectModel = this._register(new Emitter<IOminaiProvider>());
	readonly onDidSelectModel: Event<IOminaiProvider> = this._onDidSelectModel.event;
	
	private readonly _onDidClose = this._register(new Emitter<void>());
	readonly onDidClose: Event<void> = this._onDidClose.event;

	private clickOutsideListener: IDisposable | undefined;

	constructor(
		parent: HTMLElement,
		@IOminaiProviderService private readonly providerService: IOminaiProviderService
	) {
		super();
		this.container = append(parent, $('div.ominai-model-selector-dropdown'));
		hide(this.container);

		const searchWrapper = append(this.container, $('div.ominai-model-search-wrapper'));
		append(searchWrapper, $('span.codicon.codicon-search'));
		this.searchInput = append(searchWrapper, $('input.ominai-model-search-input')) as HTMLInputElement;
		this.searchInput.placeholder = 'Search AI models...';

		this.listContainer = append(this.container, $('div.ominai-model-list'));

		this._register(addDisposableListener(this.searchInput, EventType.INPUT, () => {
			this._renderList(this.searchInput.value);
		}));
		
		this._register(addDisposableListener(this.container, EventType.CLICK, (e) => {
			e.stopPropagation(); // prevent click outside from closing when clicking inside
		}));
	}

	public toggle(): void {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	public show(): void {
		if (this.isVisible) return;
		this.isVisible = true;
		show(this.container);
		this.searchInput.value = '';
		this._renderList();
		this.searchInput.focus();
		
		// Add global click listener to close when clicking outside
		setTimeout(() => {
			this.clickOutsideListener = addDisposableListener(document.body, EventType.CLICK, () => {
				this.hide();
			});
		}, 0);
	}

	public hide(): void {
		if (!this.isVisible) return;
		this.isVisible = false;
		hide(this.container);
		if (this.clickOutsideListener) {
			this.clickOutsideListener.dispose();
			this.clickOutsideListener = undefined;
		}
		this._onDidClose.fire();
	}

	private _renderList(searchQuery: string = ''): void {
		this.listContainer.textContent = ''; // clear

		const query = searchQuery.toLowerCase().trim();
		let providers = this.providerService.getProviders();

		if (query) {
			providers = providers.filter(p => 
				p.name.toLowerCase().includes(query) || 
				(p.description && p.description.toLowerCase().includes(query))
			);
		}

		if (providers.length === 0) {
			const noResults = append(this.listContainer, $('div.ominai-model-no-results'));
			noResults.textContent = 'No models found matching your search.';
			return;
		}

		// Group by tier
		const grouped = new Map<ProviderTier, IOminaiProvider[]>();
		for (const p of providers) {
			if (!grouped.has(p.tier)) {
				grouped.set(p.tier, []);
			}
			grouped.get(p.tier)!.push(p);
		}

		// Tier order mapping
		const tierOrder: ProviderTier[] = ['top', 'china', 'coding', 'research', 'aggregator', 'local', 'personal', 'creative', 'video', 'audio'];
		const tierLabels: Record<ProviderTier, string> = {
			top: '🌍 Tier 1 — Must Support (Global Leaders)',
			china: '🇨🇳 Major Chinese AI Platforms',
			coding: '💻 Coding-Focused AI',
			research: '🔍 Research & Search AI',
			aggregator: '🤖 Multi-Model Aggregators',
			local: '🏠 Local / Open Models',
			personal: '🎭 Character / Personal AI',
			creative: '🎨 Creative AI',
			video: '🎥 Video AI',
			audio: '🎵 Audio / Voice AI'
		};

		const activeId = this.providerService.getActiveProvider()?.id;

		for (const tier of tierOrder) {
			const list = grouped.get(tier);
			if (list && list.length > 0) {
				const categoryHeader = append(this.listContainer, $('div.ominai-model-category-header'));
				categoryHeader.textContent = tierLabels[tier];

				for (const p of list) {
					const item = append(this.listContainer, $('button.ominai-model-item'));
					if (p.id === activeId) {
						item.classList.add('active');
					}

					const left = append(item, $('div.ominai-model-item-left'));
					append(left, $('div.ominai-model-item-name')).textContent = p.name;
					
					if (p.description) {
						append(left, $('div.ominai-model-item-desc')).textContent = p.description;
					}

					const right = append(item, $('div.ominai-model-item-right'));
					if (p.id === activeId) {
						append(right, $('span.codicon.codicon-check'));
					}

					this._register(addDisposableListener(item, EventType.CLICK, (e) => {
						e.stopPropagation();
						this.providerService.setActiveProvider(p.id);
						this._onDidSelectModel.fire(p);
						this.hide();
					}));
				}
			}
		}
	}
}
