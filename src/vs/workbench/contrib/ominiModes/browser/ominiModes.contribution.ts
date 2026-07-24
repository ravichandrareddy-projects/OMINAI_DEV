/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { ViewContainer, IViewContainersRegistry, Extensions as ViewContainerExtensions, ViewContainerLocation, IViewsRegistry, WindowEnablement } from '../../../common/views.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { OminaiViewPane, IDummyModeViewOptions } from './ominiModesView.js';
import { RawContextKey } from '../../../../platform/contextkey/common/contextkey.js';

// Context Key for the active Omini Mode
export const ActiveOminiModeContext = new RawContextKey<string>('activeOminiMode', 'normal');

// --- Settings Registration ---
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from '../../../../platform/configuration/common/configurationRegistry.js';

Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration).registerConfiguration({
	id: 'omini',
	order: 100,
	title: localize('ominiConfigurationTitle', "OMINAI"),
	type: 'object',
	properties: {
		'omini.computerAccess': {
			type: 'string',
			enum: ['Observe Only', 'Guided Control', 'Workspace Control', 'System Control'],
			default: 'Workspace Control',
			enumDescriptions: [
				localize('omini.computerAccess.observeOnly', "OMINAI can observe project state but cannot control your computer."),
				localize('omini.computerAccess.guidedControl', "OMINAI suggests actions and requests approval before sensitive operations."),
				localize('omini.computerAccess.workspaceControl', "OMINAI can edit project files, run commands, and interact within your development workspace."),
				localize('omini.computerAccess.systemControl', "OMINAI can perform broader computer actions, browser automation, and development tasks. Recommended only on trusted machines.")
			],
			description: localize('omini.computerAccess.desc', "Controls the level of access OMINAI has to your computer.")
		},
		'omini.chatPlacement': {
			type: 'string',
			enum: ['Right Sidebar Panel', 'Bottom Dock'],
			default: 'Right Sidebar Panel',
			description: localize('omini.chatPlacement.desc', "Controls where the OMINAI Chat UI is displayed.")
		}
	}
});

// --- OMINAI Hero Panel ---
const OMINAI_CONTAINER_ID = 'workbench.view.ominai';
const OMINAI_VIEW_ID = 'workbench.view.ominai.chatView';
const ominaiIcon = registerIcon('ominai-tool-icon', Codicon.activateBreakpoints, 'Icon for OMINAI Tool');

const OMINAI_CONTAINER: ViewContainer = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry).registerViewContainer({
	id: OMINAI_CONTAINER_ID,
	title: localize2('ominaiTool', 'OMINAI'),
	icon: ominaiIcon,
	hideIfEmpty: true,
	order: 10,
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [OMINAI_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
	storageId: 'workbench.state.ominaiTool',
	windowEnablement: WindowEnablement.Both
}, ViewContainerLocation.AuxiliaryBar, { doNotRegisterOpenCommand: false }); // AuxiliaryBar is the right panel

Registry.as<IViewsRegistry>(ViewContainerExtensions.ViewsRegistry).registerViews([{
	id: OMINAI_VIEW_ID,
	containerIcon: ominaiIcon,
	name: localize2('ominaiTool', 'OMINAI'),
	canToggleVisibility: false,
	canMoveView: false,
	when: ActiveOminiModeContext.isEqualTo('omini'), // Only show in OMINAI Mode
	ctorDescriptor: new SyncDescriptor(OminaiViewPane, [<IDummyModeViewOptions>{ dummyMessage: 'OMINAI AI Engineer Operating...' }]),
	windowEnablement: WindowEnablement.Both
}], OMINAI_CONTAINER);
