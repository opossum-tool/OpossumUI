// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AppUpdater } from 'electron-updater';
import type { ProviderRuntimeOptions } from 'electron-updater/out/providers/Provider';
import { URL } from 'node:url';

import { getReleaseAssetDownloadUrl } from '../../../shared/release-assets';
import { ReleaseUpdateProvider } from '../release-update-provider';

const selectedTag = 'OpossumUI-2026-10-23.2';
const assetName = 'OpossumUI-for-win.exe';
const executor = { request: vi.fn() };

function createProvider() {
  return new ReleaseUpdateProvider(
    { provider: 'custom', url: getReleaseAssetDownloadUrl(selectedTag, '') },
    { channel: null } as AppUpdater,
    {
      platform: 'win32',
      isUseMultipleRangeRequest: true,
      executor: executor as unknown as ProviderRuntimeOptions['executor'],
    },
  );
}

test.each([
  ['2026.1020.0', 'OpossumUI-2026-10-20'],
  ['2026.1020.3', 'OpossumUI-2026-10-20.3'],
  ['2026.105.0', 'OpossumUI-2026-01-05'],
])('resolves separate old and new blockmaps for %s', (version, oldTag) => {
  const maps = createProvider().getBlockMapFiles(
    new URL(getReleaseAssetDownloadUrl(selectedTag, assetName)),
    version,
  );
  expect(maps.map((url) => url.href)).toEqual([
    getReleaseAssetDownloadUrl(oldTag, `${assetName}.blockmap`),
    getReleaseAssetDownloadUrl(selectedTag, `${assetName}.blockmap`),
  ]);
});

test('rejects unknown installed versions so the updater can fall back to a full download', () => {
  expect(() =>
    createProvider().getBlockMapFiles(
      new URL(getReleaseAssetDownloadUrl(selectedTag, assetName)),
      '0.1.0',
    ),
  ).toThrow('Cannot determine the installed release blockmap URL.');
});

test('loads the manifest and installer from the selected release using single range requests', async () => {
  const provider = createProvider();
  executor.request.mockResolvedValue(
    JSON.stringify({
      version: '2026.1023.2',
      files: [{ url: assetName, sha512: 'checksum', size: 100 }],
    }),
  );

  const info = await provider.getLatestVersion();

  expect(executor.request).toHaveBeenCalledWith(
    expect.objectContaining({
      hostname: 'github.com',
      path: `/opossum-tool/OpossumUI/releases/download/${selectedTag}/latest.yml`,
    }),
    undefined,
  );
  expect(provider.resolveFiles(info).map((file) => file.url.href)).toEqual([
    getReleaseAssetDownloadUrl(selectedTag, assetName),
  ]);
  expect(provider.isUseMultipleRangeRequest).toBe(false);
});
