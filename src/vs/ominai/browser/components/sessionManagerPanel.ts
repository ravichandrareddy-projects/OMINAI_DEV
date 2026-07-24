/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { $, append, addDisposableListener, EventType, clearNode } from '../../../base/browser/dom.js';
import { IOminaiSessionService } from '../../common/ominaiServices.js';

export class SessionManagerPanel extends Disposable {
	private readonly container: HTMLElement;
	private readonly listContainer: HTMLElement;

	constructor(
		parent: HTMLElement,
		@IOminaiSessionService private readonly sessionService: IOminaiSessionService
	) {
		super();
		this.container = append(parent, $('div.ominai-session-panel'));
		
		const header = append(this.container, $('div.ominai-session-header'));
		append(header, $('div.ominai-session-title')).textContent = 'Sessions';
		
		const newBtn = append(header, $('button.ominai-session-new-btn'));
		append(newBtn, $('span.codicon.codicon-plus'));
		newBtn.title = 'New Session';

		this._register(addDisposableListener(newBtn, EventType.CLICK, () => {
			this.sessionService.createSession();
		}));

		this.listContainer = append(this.container, $('div.ominai-session-list'));

		this._register(this.sessionService.onDidChangeSessions(() => this._render()));
		this._register(this.sessionService.onDidChangeActiveSession(() => this._render()));
		
		this._render();
	}

	private _render(): void {
		clearNode(this.listContainer);
		const sessions = this.sessionService.getSessions();
		const active = this.sessionService.getActiveSession();

		for (const session of sessions) {
			const item = append(this.listContainer, $('div.ominai-session-item'));
			if (active?.id === session.id) {
				item.classList.add('active');
			}
			item.tabIndex = 0;
			item.setAttribute('role', 'button');
			
			const title = append(item, $('span.ominai-session-item-title'));
			title.textContent = session.title;

			const delBtn = append(item, $('button.ominai-session-del-btn'));
			delBtn.innerHTML = '<span class="codicon codicon-trash"></span>';
			
			this._register(addDisposableListener(item, EventType.CLICK, (e) => {
				if (e.target !== delBtn && !delBtn.contains(e.target as Node)) {
					this.sessionService.switchSession(session.id);
				}
			}));

			this._register(addDisposableListener(delBtn, EventType.CLICK, (e) => {
				e.stopPropagation();
				this.sessionService.deleteSession(session.id);
			}));
		}
	}
}
