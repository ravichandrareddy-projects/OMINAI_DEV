/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * ProjectWorkspacePanel was removed in the 2026-07-28 CEO review (FIX-OV5).
 *
 * Its section builder code (overview, execution, browser, git, diagnostics)
 * was duplicated by WorkspaceTab in the ControlCenter. The WorkspaceTab now
 * serves as the single source of truth for project status display.
 *
 * See: src/vs/ominai/browser/controlCenter/workspaceTab.ts
 */
export { };
