/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, MutableDisposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../../workbench/common/contributions.js';
import { IWorkbenchLayoutService } from '../../../../workbench/services/layout/browser/layoutService.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ChatConfiguration } from '../../../../workbench/contrib/chat/common/constants.js';
import { ISessionsBlockedOverlayOptions, SessionsBlockedReason, SessionsPolicyBlockedOverlay } from './sessionsPolicyBlocked.js';

export class SessionsPolicyBlockedContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.sessionsPolicyBlocked';

	private readonly overlayRef = this._register(new MutableDisposable());
	private currentReason: SessionsBlockedReason | undefined;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super();

		this.update();

		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(ChatConfiguration.AgentEnabled)) {
				this.update();
			}
		}));
	}

	private update(): void {
		const agentEnabled = this.configurationService.getValue<boolean>(ChatConfiguration.AgentEnabled);
		if (agentEnabled === false) {
			this.showOverlay({ reason: SessionsBlockedReason.AgentDisabled });
			return;
		}

		this.overlayRef.clear();
		this.currentReason = undefined;
	}

	private showOverlay(options: ISessionsBlockedOverlayOptions): void {
		// AccountPolicyGate may need re-render when the account name changes.
		if (this.currentReason === options.reason && options.reason !== SessionsBlockedReason.AccountPolicyGate) {
			return;
		}
		this.overlayRef.clear();
		this.currentReason = options.reason;

		this.overlayRef.value = this.instantiationService.createInstance(
			SessionsPolicyBlockedOverlay,
			this.layoutService.mainContainer,
			options,
		);
	}
}

registerWorkbenchContribution2(SessionsPolicyBlockedContribution.ID, SessionsPolicyBlockedContribution, WorkbenchPhase.BlockRestore);
