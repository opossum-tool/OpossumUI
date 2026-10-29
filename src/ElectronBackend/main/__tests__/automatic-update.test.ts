// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { net } from 'electron';
import type { AppUpdater } from 'electron-updater';
import { EventEmitter } from 'node:events';

import { getReleaseAssetDownloadUrl } from '../../../shared/release-assets';
import { createInstallerUpdater } from '../installer-updater';
import { ReleaseUpdateProvider } from '../release-update-provider';
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateState,
  initializeUpdateService,
  installDownloadedUpdate,
  startAutomaticUpdateChecks,
  stopAutomaticUpdateChecks,
} from '../update-service';

vi.mock('electron', () => ({
  app: { isPackaged: true },
  net: { fetch: vi.fn() },
}));
vi.mock('../send-to-renderers', () => ({ sendToRenderers: vi.fn() }));
vi.mock('../installer-updater', () => ({
  createInstallerUpdater: vi.fn(),
  supportsInstallation: () => true,
}));

const tag = 'OpossumUI-2026-10-23.2';
const assetName = 'OpossumUI-for-win.exe';
const fake = Object.assign(new EventEmitter(), {
  setFeedURL: vi.fn(),
  checkForUpdates: vi.fn(),
  downloadUpdate: vi.fn(),
  quitAndInstall: vi.fn(),
});
function release() {
  return {
    tag_name: tag,
    draft: false,
    prerelease: false,
    assets: [assetName, `${assetName}.blockmap`, 'latest.yml'].map((name) => ({
      name,
      browser_download_url: getReleaseAssetDownloadUrl(tag, name),
      state: 'uploaded',
      size: 100,
    })),
  };
}
function info() {
  return {
    version: '2026.1023.2',
    files: [{ url: assetName, size: 100, sha512: 'checksum' }],
    path: assetName,
    sha512: 'checksum',
    releaseDate: '2026-10-23',
  };
}
function manifest(updateInfo = info()) {
  return { isUpdateAvailable: true, updateInfo };
}
async function settle() {
  await vi.waitFor(() =>
    expect(getUpdateState().status).not.toBe('downloading'),
  );
  await Promise.resolve();
}

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;
beforeEach(() => {
  Object.defineProperty(process, 'platform', { value: 'win32' });
  initializeUpdateService('2026.1020.0');
  vi.mocked(createInstallerUpdater).mockReturnValue(
    fake as unknown as AppUpdater,
  );
  vi.mocked(net.fetch).mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(release()))),
  );
  fake.checkForUpdates.mockResolvedValue(manifest());
  fake.downloadUpdate.mockResolvedValue(['/cache/update.exe']);
});
afterEach(() => {
  stopAutomaticUpdateChecks();
  Object.defineProperty(process, 'platform', originalPlatform);
  vi.unstubAllEnvs();
});

test('checks discover an installable release without downloading, even when repeated', async () => {
  startAutomaticUpdateChecks();
  await vi.waitFor(() =>
    expect(getUpdateState()).toMatchObject({
      status: 'available',
      canInstall: true,
    }),
  );
  await checkForUpdates();
  expect(fake.checkForUpdates).not.toHaveBeenCalled();
  expect(fake.downloadUpdate).not.toHaveBeenCalled();
  expect(fake.quitAndInstall).not.toHaveBeenCalled();
});

test('refuses download requests without discovery or for a different release', async () => {
  await expect(downloadUpdate(tag)).rejects.toThrow('no longer available');
  await checkForUpdates();
  await expect(downloadUpdate('OpossumUI-2099-01-01')).rejects.toThrow(
    'no longer available',
  );
  expect(fake.downloadUpdate).not.toHaveBeenCalled();
});

test('pins the release feed to discovery, validates before download, and never installs on normal quit', async () => {
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  expect(fake.setFeedURL).toHaveBeenCalledWith(
    expect.objectContaining({
      provider: 'custom',
      updateProvider: ReleaseUpdateProvider,
      url: getReleaseAssetDownloadUrl(tag, ''),
      channel: 'latest',
    }),
  );
  expect(fake.checkForUpdates).toHaveBeenCalledBefore(fake.downloadUpdate);
  expect(getUpdateState()).toEqual({ status: 'downloaded', tag });
  expect(fake.quitAndInstall).not.toHaveBeenCalled();
});

test.each(['latest.yml', assetName, `${assetName}.blockmap`])(
  'waits for uploaded, nonempty %s',
  async (name) => {
    for (const incomplete of [{ size: 0 }, { state: 'uploading' }]) {
      const selected = release();
      Object.assign(
        selected.assets.find((asset) => asset.name === name)!,
        incomplete,
      );
      vi.mocked(net.fetch).mockResolvedValue(
        new Response(JSON.stringify(selected)),
      );
      await expect(checkForUpdates()).resolves.toMatchObject({
        status: 'up-to-date',
      });
    }
    const selected = release();
    selected.assets = selected.assets.filter((asset) => asset.name !== name);
    vi.mocked(net.fetch).mockResolvedValue(
      new Response(JSON.stringify(selected)),
    );
    await checkForUpdates();
    expect(fake.downloadUpdate).not.toHaveBeenCalled();
  },
);

test.each([
  { version: '2026.1024.0' },
  { version: '2026.1023.2-beta' },
  {
    files: [
      { url: 'https://example.com/update.exe', size: 100, sha512: 'checksum' },
    ],
  },
  {
    files: [
      {
        url: `../OpossumUI-2026-10-24/${assetName}`,
        size: 100,
        sha512: 'checksum',
      },
    ],
  },
  { files: [{ url: assetName, size: 0, sha512: 'checksum' }] },
  { files: [{ url: assetName, size: 100, sha512: '' }] },
  { files: [] },
  { path: 'other.exe' },
  { packages: { x64: { path: 'https://example.com/package.7z' } } },
])('rejects a mismatched manifest %j', async (changes) => {
  fake.checkForUpdates.mockResolvedValue(manifest({ ...info(), ...changes }));
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  expect(getUpdateState()).toMatchObject({
    status: 'error',
    retry: 'download',
  });
  expect(fake.downloadUpdate).not.toHaveBeenCalled();
});

test('coalesces checks and pins the selection while downloading and after completion', async () => {
  const pending = Promise.withResolvers<string[]>();
  fake.downloadUpdate.mockReturnValue(pending.promise);
  const first = checkForUpdates();
  expect(checkForUpdates()).toBe(first);
  await first;
  await downloadUpdate(tag);
  await downloadUpdate(tag);
  await vi.waitFor(() => expect(fake.downloadUpdate).toHaveBeenCalledTimes(1));
  fake.emit('download-progress', { percent: 42 });
  expect(await checkForUpdates()).toEqual({
    status: 'downloading',
    tag,
    percent: 42,
  });
  fake.emit('update-downloaded', { version: '9999.101.0' });
  expect(getUpdateState().status).toBe('downloading');
  pending.resolve(['/cache/update.exe']);
  await settle();
  fake.emit('download-progress', { percent: 5 });
  fake.emit('update-available', { version: '9999.101.0' });
  fake.emit('error', new Error('stale error'));
  expect(await checkForUpdates()).toEqual({ status: 'downloaded', tag });
  expect(net.fetch).toHaveBeenCalledTimes(1);
  expect(fake.listenerCount('download-progress')).toBe(1);
});

test('handles emitted errors and rejected promises, and retries the same release', async () => {
  fake.downloadUpdate.mockImplementationOnce(() => {
    const failure = new Error('Network disconnected');
    fake.emit('error', failure);
    return Promise.reject(failure);
  });
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  expect(getUpdateState()).toMatchObject({
    status: 'error',
    retry: 'download',
    message: 'Network disconnected',
  });
  await downloadUpdate(tag);
  await settle();
  expect(getUpdateState()).toEqual({ status: 'downloaded', tag });
  expect(fake.downloadUpdate).toHaveBeenCalledTimes(2);
  expect(net.fetch).toHaveBeenCalledTimes(1);
});

test('does not retry a failed download during a subsequent check', async () => {
  fake.downloadUpdate.mockRejectedValueOnce(new Error('Offline'));
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  expect(getUpdateState()).toMatchObject({
    status: 'error',
    retry: 'download',
  });
  await expect(checkForUpdates()).resolves.toMatchObject({
    status: 'available',
    canInstall: true,
  });
  expect(fake.downloadUpdate).toHaveBeenCalledTimes(1);
});

test('delegates installation and exit to the updater only for a downloaded update', async () => {
  expect(() => installDownloadedUpdate()).toThrow(
    'No downloaded update is ready.',
  );
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  installDownloadedUpdate();
  expect(getUpdateState()).toEqual({ status: 'restarting', tag });
  installDownloadedUpdate();
  expect(fake.quitAndInstall).toHaveBeenCalledExactlyOnceWith(false, true);
});

test('keeps the downloaded update available after emitted installation errors', async () => {
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  installDownloadedUpdate();
  fake.emit('error', new Error('Installer failed'));
  expect(getUpdateState()).toEqual({
    status: 'downloaded',
    tag,
    error: 'Installer failed',
  });
  installDownloadedUpdate();
  expect(fake.quitAndInstall).toHaveBeenCalledTimes(2);
});

test('propagates thrown installation errors and allows retry', async () => {
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  fake.quitAndInstall.mockImplementationOnce(() => {
    throw new Error('Could not start installer');
  });
  expect(() => installDownloadedUpdate()).toThrow('Could not start installer');
  expect(getUpdateState()).toEqual({
    status: 'downloaded',
    tag,
    error: 'Could not start installer',
  });
  installDownloadedUpdate();
  expect(fake.quitAndInstall).toHaveBeenCalledTimes(2);
});

test('requires the AppImage manifest and pins Linux downloads to the discovered release', async () => {
  Object.defineProperty(process, 'platform', { value: 'linux' });
  vi.stubEnv('APPIMAGE', '/test/AppImage');
  vi.stubEnv('SNAP', '');
  const selected = release();
  const image = 'OpossumUI-for-linux.AppImage';
  selected.assets = [image, 'latest-linux.yml'].map((name) => ({
    name,
    browser_download_url: getReleaseAssetDownloadUrl(tag, name),
    state: 'uploaded',
    size: 100,
  }));
  fake.checkForUpdates.mockResolvedValue(
    manifest({
      ...info(),
      path: image,
      files: [{ url: image, size: 100, sha512: 'checksum' }],
    }),
  );
  vi.mocked(net.fetch).mockResolvedValue(
    new Response(
      JSON.stringify({ ...selected, assets: selected.assets.slice(0, 1) }),
    ),
  );
  await expect(checkForUpdates()).resolves.toMatchObject({
    status: 'up-to-date',
  });
  expect(fake.downloadUpdate).not.toHaveBeenCalled();
  vi.mocked(net.fetch).mockResolvedValue(
    new Response(JSON.stringify(selected)),
  );
  await checkForUpdates();
  await downloadUpdate(tag);
  await settle();
  expect(getUpdateState()).toEqual({ status: 'downloaded', tag });
  expect(fake.setFeedURL).toHaveBeenCalledWith(
    expect.objectContaining({ url: getReleaseAssetDownloadUrl(tag, '') }),
  );
});
