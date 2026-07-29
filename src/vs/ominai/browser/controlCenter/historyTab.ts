/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType } from '../../../base/browser/dom.js';
import { Emitter, Event } from '../../../base/common/event.js';
/**
 * A workspace history entry.
 * Extends IOminaiSession with UI-friendly display fields.
 */
export interface IHistoryEntry {
	readonly id: string;
	projectName: string;
	date: string;       // displayed date, e.g. "Jul 26, 2026"
	provider: string;   // e.g. "Claude Opus"
	duration: string;   // e.g. "12m 34s"
	status: 'completed' | 'failed' | 'interrupted';
}

export interface IHistoryData {
	entries: IHistoryEntry[];
}

const MOCK_HISTORY: IHistoryEntry[] = [
	{ id: 'h1', projectName: 'OMINAI Control Center', date: 'Jul 26, 2026', provider: 'Claude Opus', duration: '8m 12s', status: 'completed' },
	{ id: 'h2', projectName: 'Style Engine Refactor', date: 'Jul 25, 2026', provider: 'Claude Opus', duration: '24m 5s', status: 'completed' },
	{ id: 'h3', projectName: 'API Integration Layer', date: 'Jul 24, 2026', provider: 'GPT-4o', duration: '15m 42s', status: 'completed' },
	{ id: 'h4', projectName: 'TypeScript Migration', date: 'Jul 23, 2026', provider: 'Claude Opus', duration: '1h 3m', status: 'failed' },
	{ id: 'h5', projectName: 'Browser Adapter', date: 'Jul 22, 2026', provider: 'Claude Opus', duration: '42m 18s', status: 'interrupted' },
];

/**
 * HistoryTab — previous OMINAI workspaces browser.
 *
 * Each entry shows project name, date, provider, duration, and status.
 * Clicking fires an event so the host can restore that workspace.
 */
export class HistoryTab extends Disposable {
	private readonly body: HTMLElement;
	private readonly listEl: HTMLElement;
	private currentEntries: IHistoryEntry[];
	private readonly entryElements: Map<string, HTMLElement> = new Map();

	private readonly _onDidSelectEntry = this._register(new Emitter<IHistoryEntry>());
	readonly onDidSelectEntry: Event<IHistoryEntry> = this._onDidSelectEntry.event;

	constructor(
		private readonly container: HTMLElement,
		data: IHistoryData = { entries: MOCK_HISTORY },
	) {
		super();
		this.currentEntries = [...data.entries];
		this.container.classList.add('ominai-history-tab');

		this.body = append(this.container, $('div.ominai-panel-body'));
		this.listEl = append(this.body, $('div.ominai-history-list'));

		this._buildEntries(this.currentEntries);
	}

	public update(data: IHistoryData): void {
		const newEntries = data.entries;
		const oldIds = new Set(this.currentEntries.map(e => e.id));
		const newIds = new Set(newEntries.map(e => e.id));

		// Remove deleted entries
		for (const id of oldIds) {
			if (!newIds.has(id)) {
				const el = this.entryElements.get(id);
				if (el) {
					el.remove();
					this.entryElements.delete(id);
				}
			}
		}

		// Build a map of old entries for comparison
		const oldEntryMap = new Map(this.currentEntries.map(e => [e.id, e]));

		// Add or update entries, preserving insertion order
		for (const entry of newEntries) {
			const existingEl = this.entryElements.get(entry.id);
			if (existingEl) {
				// Targeted updates — only update changed fields
				const oldEntry = oldEntryMap.get(entry.id);
				if (oldEntry && entry.status !== oldEntry.status) {
					const badge = existingEl.querySelector('.ominai-history-badge') as HTMLElement;
					if (badge) {
						badge.className = 'ominai-history-badge';
						badge.classList.add(`status-${entry.status}`);
						badge.textContent = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
					}
				}
				if (oldEntry && entry.projectName !== oldEntry.projectName) {
					const nameEl = existingEl.querySelector('.ominai-history-name') as HTMLElement;
					if (nameEl) nameEl.textContent = entry.projectName;
				}
				const details = existingEl.querySelector('.ominai-history-details');
				if (details) {
					const detailEls = details.querySelectorAll('.ominai-history-detail');
					if (detailEls.length >= 3) {
						detailEls[0].querySelector('span:last-child')!.textContent = entry.date;
						detailEls[1].querySelector('span:last-child')!.textContent = entry.provider;
						detailEls[2].querySelector('span:last-child')!.textContent = entry.duration;
					}
				}
			} else {
				// New entry — build element and insert at correct position
				const card = this._buildEntryCard(entry);
				this.entryElements.set(entry.id, card);
				const nextId = this._findNextEntryId(entry.id, newEntries);
				const nextEl = nextId ? this.entryElements.get(nextId) : undefined;
				if (nextEl && nextEl.parentElement) {
					this.listEl.insertBefore(card, nextEl);
				} else {
					this.listEl.appendChild(card);
				}
			}
		}

		this.currentEntries = [...newEntries];
	}

	private _findNextEntryId(currentId: string, entries: IHistoryEntry[]): string | undefined {
		const idx = entries.findIndex(e => e.id === currentId);
		if (idx >= 0 && idx < entries.length - 1) {
			return entries[idx + 1].id;
		}
		return undefined;
	}

	private _buildEntryCard(entry: IHistoryEntry): HTMLElement {
		const card = $('div.ominai-history-card');
		card.dataset.entryId = entry.id;

		// Top row: project name + status badge
		const topRow = append(card, $('div.ominai-history-top'));
		const name = append(topRow, $('span.ominai-history-name'));
		name.textContent = entry.projectName;

		const badge = append(topRow, $('span.ominai-history-badge'));
		badge.classList.add(`status-${entry.status}`);
		badge.textContent = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);

		// Details row: date, provider, duration
		const details = append(card, $('div.ominai-history-details'));
		this._addDetail(details, 'codicon-calendar', entry.date);
		this._addDetail(details, 'codicon-comment-discussion', entry.provider);
		this._addDetail(details, 'codicon-history', entry.duration);

		// Click to restore — registered once, never recreated
		this._register(addDisposableListener(card, EventType.CLICK, () => {
			this._onDidSelectEntry.fire(entry);
		}));

		return card;
	}

	private _buildEntries(entries: IHistoryEntry[]): void {
		for (const entry of entries) {
			const card = this._buildEntryCard(entry);
			this.entryElements.set(entry.id, card);
			this.listEl.appendChild(card);
		}
	}

	private _addDetail(parent: HTMLElement, iconClass: string, value: string): void {
		const el = append(parent, $('span.ominai-history-detail'));
		append(el, $(`span.codicon.${iconClass}`));
		const text = append(el, $('span'));
		text.textContent = value;
	}
}
