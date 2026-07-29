/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { $, append } from '../../../../base/browser/dom.js';

/**
 * WorkspaceSettings — workspace management preferences pane.
 */
export class WorkspaceSettings extends Disposable {
	constructor(private readonly container: HTMLElement) {
		super();
		this.container.classList.add('ominai-settings-group');
		this.build();
	}

	private build(): void {
		const items = [
			{ icon: 'codicon-file-submodule', label: 'Project Indexing', desc: 'Enabled' },
			{ icon: 'codicon-exclude', label: 'Ignored Folders', desc: 'node_modules, .git' },
			{ icon: 'codicon-sync', label: 'Auto Refresh', desc: 'Enabled' },
			{ icon: 'codicon-source-control', label: 'Git Integration', desc: 'Enabled' },
			{ icon: 'codicon-diff', label: 'Patch Preview', desc: 'Enabled' },
			{ icon: 'codicon-database', label: 'Workspace Memory', desc: 'Enabled' },
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
