/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Configuration constants for the OMINI mode views and behaviour.
 */

/** Storage key for OMINI mode layout state. */
export const OMINI_LAYOUT_STATE_KEY = 'omini.layoutState';

/** Known browser-based AI providers shown in the OMINI orchestrator view. */
export const OMINI_BROWSER_PROVIDERS = [
	{ id: 'chatgpt', label: 'ChatGPT', icon: '🤖' },
	{ id: 'claude', label: 'Claude', icon: '🟣' },
	{ id: 'gemini', label: 'Gemini', icon: '🔵' },
	{ id: 'kimi', label: 'Kimi', icon: '🟢' },
] as const;

/** Default browser session poll interval in ms. */
export const OMINI_BROWSER_POLL_INTERVAL = 5000;

/** Maximum number of concurrent browser sessions. */
export const OMINI_MAX_CONCURRENT_SESSIONS = 4;
