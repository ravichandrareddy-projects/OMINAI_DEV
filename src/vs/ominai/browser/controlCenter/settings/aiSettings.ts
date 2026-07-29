/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { $, append } from '../../../../base/browser/dom.js';

/**
 * AISettings — AI provider and model settings pane.
 */
export class AISettings extends Disposable {
	constructor(private readonly container: HTMLElement) {
		super();
		this.container.classList.add('ominai-settings-group');
		this.build();
	}

	private build(): void {
		const items = [
			{ icon: 'codicon-rocket', label: 'Default Provider', desc: 'Claude Opus' },
			{ icon: 'codicon-light-bulb', label: 'Reasoning Style', desc: 'Balanced' },
			{ icon: 'codicon-arrow-both', label: 'Context Window', desc: '128K tokens' },
			{ icon: 'codicon-play-circle', label: 'Streaming', desc: 'Enabled' },
			{ icon: 'codicon-comment', label: 'Response Style', desc: 'Concise' },
			{ icon: 'codicon-compress', label: 'Prompt Compression', desc: 'Automatic' },
			{ icon: 'codicon-dash', label: 'Token Optimization', desc: 'Enabled' },
			{ icon: 'codicon-debug-continue', label: 'Auto Continue', desc: 'Enabled' },
		];
		for (const item of items) {
			this.addRow(item.icon, item.label, item.desc);
		}
	}

	private addRow(icon: string, label: string, desc: string): void {
		const row = append(this.container, $('div.ominai-settings-row'));
		append(row, $(`span.codicon.${icon}`));
		const content = append(row, $('div.ominai-settings-row-content'));
		append(content, $('div.ominai-settings-row-label')).textContent = label;
		append(content, $('div.ominai-settings-row-desc')).textContent = desc;
	}
}
