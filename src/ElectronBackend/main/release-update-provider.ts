// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AppUpdater } from 'electron-updater';
import { GenericProvider } from 'electron-updater/out/providers/GenericProvider';
import type { ProviderRuntimeOptions } from 'electron-updater/out/providers/Provider';
import { URL } from 'node:url';

import {
  getReleaseAssetDownloadUrl,
  UPDATE_ASSET_NAMES,
} from '../../shared/release-assets';
import {
  formatReleaseTag,
  parseInstalledVersion,
} from '../../shared/update-version';

type CustomProviderOptions = Extract<
  Parameters<AppUpdater['setFeedURL']>[0],
  { provider: 'custom' }
>;

export class ReleaseUpdateProvider extends GenericProvider {
  constructor(
    configuration: CustomProviderOptions,
    updater: AppUpdater,
    runtimeOptions: ProviderRuntimeOptions,
  ) {
    if (typeof configuration.url !== 'string') {
      throw new Error('The release update feed URL is missing.');
    }
    super(
      { provider: 'generic', url: configuration.url, channel: 'latest' },
      updater,
      { ...runtimeOptions, isUseMultipleRangeRequest: false },
    );
  }

  override getBlockMapFiles(baseUrl: URL, oldVersion: string): Array<URL> {
    const installed = parseInstalledVersion(oldVersion);
    if (!installed) {
      // electron-updater falls back to a full download if blockmap lookup fails.
      throw new Error('Cannot determine the installed release blockmap URL.');
    }
    // Date-based release tags do not contain the numeric application version,
    // so the generic provider's version substitution cannot locate the old map.
    return [
      new URL(
        getReleaseAssetDownloadUrl(
          formatReleaseTag(installed),
          `${UPDATE_ASSET_NAMES.windows}.blockmap`,
        ),
      ),
      new URL(`${baseUrl.href}.blockmap`),
    ];
  }
}
