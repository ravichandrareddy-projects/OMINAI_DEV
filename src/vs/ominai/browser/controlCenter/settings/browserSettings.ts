/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { $, append } from '../../../../base/browser/dom.js';

/**
 * BrowserSettings — browser automation preferences pane.
 */
export class BrowserSettings extends Disposable {
	constructor(private readonly container: HTMLElement) {
		super();
		this.container.classList.add('ominai-settings-group');
		this.build();
	}

	private build(): void {
		const items = [
			{ icon: 'codicon-globe', label: 'Default Browser', desc: 'System Default' },
			{ icon: 'codicon-debug-restart', label: 'Reuse Browser Session', desc: 'Enabled' },
			{ icon: 'codicon-person', label: 'Browser Profile', desc: 'Default' },
			{ icon: 'codicon-database', label: 'Cookie Manager', desc: '' },
			{ icon: 'codicon-cloud-download', label: 'Downloads', desc: 'Ask each time' },
			{ icon: 'codicon-clock', label: 'Timeout', desc: '30 seconds' },
			{ icon: 'codicon-eye-closed', label: 'Headless Mode', desc: 'Enabled' },
			{ icon: 'codicon-device-camera', label: 'Screenshot Quality', desc: 'High' },
		];
		for (const item of items) {
			const row = append(this.container, $('div.ominai-settings-row'));
			append(row, $(`span.codicon.${item.icon}`));
			const content = append(row, $('div.ominai-settings-row-content'));
			append(content, $('div.ominai-settings-row-label')).textContent = item.label;
			if (item.desc) {
				append(content, $('div.ominai-settings-row-desc')).textContent = item.desc;
			}
			if (!item.desc) {
				append(row, $('span.codicon.codicon-chevron-right.ominai-settings-action-arrow'));
			}
		}
	}
}
