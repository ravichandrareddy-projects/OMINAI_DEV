/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { $, append } from '../../../../base/browser/dom.js';

/**
 * LabsSettings — experimental features pane.
 * All features shown as disabled with "Coming Soon" badges.
 */
export class LabsSettings extends Disposable {
	constructor(private readonly container: HTMLElement) {
		super();
		this.container.classList.add('ominai-settings-group');
		this.build();
	}

	private build(): void {
		const items = [
			{ icon: 'codicon-mic', label: 'Voice', desc: 'Voice input & output' },
			{ icon: 'codicon-device-camera', label: 'Vision', desc: 'Screen & image understanding' },
			{ icon: 'codicon-plug', label: 'MCP', desc: 'Model Context Protocol' },
			{ icon: 'codicon-robot', label: 'Agentic Mode', desc: 'Autonomous task execution' },
			{ icon: 'codicon-extensions', label: 'Future Integrations', desc: 'Custom tool integrations' },
		];
		for (const item of items) {
			const row = append(this.container, $('div.ominai-settings-row.ominai-labs-row'));
			append(row, $(`span.codicon.${item.icon}`));
			const content = append(row, $('div.ominai-settings-row-content'));
			append(content, $('div.ominai-settings-row-label')).textContent = item.label;
			append(content, $('div.ominai-settings-row-desc')).textContent = item.desc;

			const badge = append(row, $('span.ominai-labs-coming-soon'));
			badge.textContent = 'Coming Soon';
		}
	}
}
