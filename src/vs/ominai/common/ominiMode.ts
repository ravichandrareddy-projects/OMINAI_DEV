/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RawContextKey } from '../../platform/contextkey/common/contextkey.js';
import { Emitter } from '../../base/common/event.js';

export const enum OMINIMode {
	Code = 'code',
	Agent = 'agent',
	OMINI = 'omini',
}

export interface IOMINIModeDefinition {
	readonly mode: OMINIMode;
	readonly label: string;
	readonly description: string;
	readonly disabled?: boolean;
	readonly badge?: string;
}

export const OMINI_MODE_CONTEXT_KEY = new RawContextKey<OMINIMode>('ominiMode', OMINIMode.Code);
export const onDidChangeOMINIMode = new Emitter<OMINIMode>();
