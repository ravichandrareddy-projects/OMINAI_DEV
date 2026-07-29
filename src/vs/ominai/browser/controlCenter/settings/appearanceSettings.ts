/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { $, append } from '../../../../base/browser/dom.js';

/**
 * AppearanceSettings — visual customization pane.
 */
export class AppearanceSettings extends Disposable {
	constructor(private readonly container: HTMLElement) {
		super();
		this.container.classList.add('ominai-settings-group');
		this.build();
	}

	private build(): void {
		const items = [
			{ icon: 'codicon-eyedropper', label: 'Accent Color', desc: 'Purple' },
			{ icon: 'codicon-color-mode', label: 'Theme', desc: 'Follow VS Code' },
			{ icon: 'codicon-text-size', label: 'Typography', desc: 'Default' },
			{ icon: 'codicon-dash', label: 'Density', desc: 'Comfortable' },
			{ icon: 'codicon-layout-sidebar-left', label: 'Sidebar Width', desc: '320px' },
			{ icon: 'codicon-play', label: 'Animations', desc: 'Enabled' },
			{ icon: 'codicon-comment', label: 'Prompt Style', desc: 'Default' },
		];
		for (const item of items) {
			const row = append(this.container, $('div.ominai-settings-row'));
			append(row, $(`span.codicon.${item.icon}`));
			const content = append(row, $('div.ominai-settings-row-content'));
			append(content, $('div.ominai-settings-row-label')).textContent = item.label;
			append(content, $('div.ominai-settings-row-desc')).textContent = item.desc;
		}
	}
}
