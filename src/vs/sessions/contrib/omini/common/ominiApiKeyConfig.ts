/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';

export const OMINI_API_PROVIDERS_KEY = 'omini.apiProviders';

/**
 * A single API provider configuration (provider URL, API key, model).
 */
export interface IApiProviderConfig {
	/** Unique identifier for this provider entry */
	readonly id: string;
	/** User-friendly display name (e.g. "OpenAI", "Custom") */
	name: string;
	/** API endpoint URL */
	apiUrl: string;
	/** The API key (stored in-memory while app is running) */
	apiKey: string;
	/** Model identifier (e.g. "gpt-4", "claude-3-opus") */
	model: string;
	/** Whether this is the currently active provider */
	isActive: boolean;
}

export const IOMINIKeychainService = createDecorator<IOMINIKeychainService>('ominiKeychainService');

export interface IOMINIKeychainService {
	readonly _serviceBrand: undefined;

	/** Get all configured providers. */
	getProviders(): IApiProviderConfig[];

	/** Save (create or update) a provider configuration. */
	saveProvider(config: IApiProviderConfig): void;

	/** Remove a provider by ID. */
	removeProvider(id: string): void;

	/** Get the active provider, or `undefined` if none is configured. */
	getActiveProvider(): IApiProviderConfig | undefined;

	/** Set a provider as the active one (deactivates others). */
	setActiveProvider(id: string): void;
}

/**
 * Keychain service that stores API provider configurations in
 * `IStorageService` under `OMINI_API_PROVIDERS_KEY`.
 *
 * The API key itself is stored as part of the serialised JSON. A future
 * iteration should move it into OS keychain via `ISecretStorageService`.
 */
export class OMINIKeychainService implements IOMINIKeychainService {

	declare readonly _serviceBrand: undefined;

	constructor(
		@IStorageService private readonly storageService: IStorageService,
	) { }

	getProviders(): IApiProviderConfig[] {
		const raw = this.storageService.get(OMINI_API_PROVIDERS_KEY, StorageScope.APPLICATION, '[]');
		try {
			return JSON.parse(raw) as IApiProviderConfig[];
		} catch {
			return [];
		}
	}

	saveProvider(config: IApiProviderConfig): void {
		const providers = this.getProviders();
		const idx = providers.findIndex(p => p.id === config.id);
		if (idx >= 0) {
			providers[idx] = config;
		} else {
			providers.push(config);
		}
		this._persist(providers);
	}

	removeProvider(id: string): void {
		const providers = this.getProviders().filter(p => p.id !== id);
		this._persist(providers);
	}

	getActiveProvider(): IApiProviderConfig | undefined {
		return this.getProviders().find(p => p.isActive);
	}

	setActiveProvider(id: string): void {
		const providers = this.getProviders();
		for (const p of providers) {
			p.isActive = (p.id === id);
		}
		this._persist(providers);
	}

	private _persist(providers: IApiProviderConfig[]): void {
		this.storageService.store(
			OMINI_API_PROVIDERS_KEY,
			JSON.stringify(providers),
			StorageScope.APPLICATION,
			StorageTarget.MACHINE,
		);
	}
}
