// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, BrowserWindow, net } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import {
  checkForUpdates,
  compareReleaseTags,
  evaluateRelease,
  getUpdateState,
  parseReleaseTag,
  selectRequiredAsset,
  startAutomaticUpdateChecks,
  stopAutomaticUpdateChecks,
} from '../update-service';

vi.mock('electron', () => ({
  app: { isPackaged: true, runningUnderARM64Translation: false },
  BrowserWindow: { getAllWindows: vi.fn(() => []) },
  net: { fetch: vi.fn() },
}));
vi.mock('electron-log', () => ({
  default: { info: vi.fn(), warn: vi.fn() },
}));
vi.mock('../../../commitInfo.json', () => ({
  default: { commitInfo: 'OpossumUI-2026-10-20' },
}));

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
const originalArchitecture = Object.getOwnPropertyDescriptor(process, 'arch');

describe('update service release tags', () => {
  beforeEach(() => {
    setPackaged(true);
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'linux',
    });
    Object.defineProperty(process, 'arch', {
      configurable: true,
      value: 'x64',
    });
    vi.mocked(net.fetch).mockReset();
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([]);
  });

  afterEach(() => {
    stopAutomaticUpdateChecks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
    if (originalArchitecture) {
      Object.defineProperty(process, 'arch', originalArchitecture);
    }
  });

  it('recognizes valid date tags and rejects invalid or untagged versions', () => {
    expect(parseReleaseTag('OpossumUI-2026-10-20')).toEqual({
      year: 2026,
      month: 10,
      day: 20,
      revision: 0,
    });
    expect(parseReleaseTag('OpossumUI-2026-10-20.2')?.revision).toBe(2);
    expect(parseReleaseTag('OpossumUI-2026-02-30')).toBeUndefined();
    expect(parseReleaseTag('44a171852')).toBeUndefined();
  });

  it('orders dates and numeric same-day revisions', () => {
    const base = parseReleaseTag('OpossumUI-2026-10-20')!;
    expect(
      compareReleaseTags(parseReleaseTag('OpossumUI-2026-10-19.99')!, base),
    ).toBeLessThan(0);
    expect(
      compareReleaseTags(base, parseReleaseTag('OpossumUI-2026-10-20.2')!),
    ).toBeLessThan(0);
    expect(compareReleaseTags(base, base)).toBe(0);
  });

  it('shares a concurrent check and applies the 30-second timeout', async () => {
    let finishResponse: ((response: Response) => void) | undefined;
    const response = new Promise<Response>((resolve) => {
      finishResponse = resolve;
    });
    vi.mocked(net.fetch).mockReturnValue(response);
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const send = vi.fn();
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([
      { webContents: { send } } as unknown as Electron.BrowserWindow,
    ]);
    const firstCheck = checkForUpdates();
    const secondCheck = checkForUpdates();
    expect(firstCheck).toBe(secondCheck);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(timeout).toHaveBeenCalledWith(30_000);
    finishResponse?.({
      ok: true,
      json: () =>
        Promise.resolve({
          assets: [],
          draft: false,
          prerelease: false,
          tag_name: 'OpossumUI-2026-10-20',
        }),
    } as Response);
    await expect(firstCheck).resolves.toEqual({
      status: 'up-to-date',
      installedTag: 'OpossumUI-2026-10-20',
    });
    await expect(secondCheck).resolves.toEqual({
      status: 'up-to-date',
      installedTag: 'OpossumUI-2026-10-20',
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(
      1,
      AllowedFrontendChannels.UpdateStateChanged,
      { status: 'checking' },
    );
    expect(send).toHaveBeenNthCalledWith(
      2,
      AllowedFrontendChannels.UpdateStateChanged,
      { status: 'up-to-date', installedTag: 'OpossumUI-2026-10-20' },
    );
    timeout.mockRestore();
  });

  it('turns HTTP and malformed response failures into error states', async () => {
    vi.mocked(net.fetch).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);
    await expect(checkForUpdates()).resolves.toEqual({
      status: 'error',
      message: 'GitHub returned HTTP 503.',
    });
    expect(net.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      expect.any(Object),
    );
    vi.mocked(net.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
    await expect(checkForUpdates()).resolves.toMatchObject({ status: 'error' });
  });

  it('returns an unknown installed-version error without fetching', async () => {
    vi.doMock('../../../commitInfo.json', () => ({
      default: { commitInfo: '44a171852' },
    }));
    vi.resetModules();
    const updateService = await import('../update-service');
    const { net: isolatedNet } = await import('electron');

    await expect(updateService.checkForUpdates()).resolves.toEqual({
      status: 'error',
      message: 'The installed release version cannot be determined',
    });
    expect(isolatedNet.fetch).not.toHaveBeenCalled();

    vi.doUnmock('../../../commitInfo.json');
    vi.resetModules();
  });

  it('does not poll when the installation has no supported package format', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '');
    vi.stubEnv('SNAP', '');
    startAutomaticUpdateChecks();
    stopAutomaticUpdateChecks();
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(net.fetch).not.toHaveBeenCalled();
  });

  it('does not start automatic checks in an unpackaged installation', async () => {
    vi.useFakeTimers();
    setPackaged(false);
    vi.stubEnv('APPIMAGE', '/app');
    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).not.toHaveBeenCalled();
  });

  it('does not start automatic checks during RESET', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/test/app');
    vi.stubEnv('RESET', '1');
    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not start automatic checks for an unsupported installation', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '');
    vi.stubEnv('SNAP', '');
    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).not.toHaveBeenCalled();
  });

  it('starts polling immediately and stops a pending timeout', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/app');
    vi.mocked(net.fetch).mockResolvedValue(releaseResponse(readyRelease()));
    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);

    stopAutomaticUpdateChecks();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not reschedule a check that finishes after automatic checks stop', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/app');
    let finishResponse: ((response: Response) => void) | undefined;
    vi.mocked(net.fetch).mockReturnValue(
      new Promise((resolve) => {
        finishResponse = resolve;
      }),
    );
    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(1);

    stopAutomaticUpdateChecks();
    finishResponse?.(releaseResponse(preparingRelease()));
    await flushMicrotasks();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reuses an in-flight request when polling is re-enabled', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/app');
    let finishResponse: ((response: Response) => void) | undefined;
    vi.mocked(net.fetch).mockReturnValue(
      new Promise((resolve) => {
        finishResponse = resolve;
      }),
    );

    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(1);
    stopAutomaticUpdateChecks();
    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(1);

    finishResponse?.(releaseResponse(preparingRelease()));
    await flushMicrotasks();
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000 - 1);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries preparation every ten minutes until the asset is ready', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/app');
    vi.mocked(net.fetch).mockResolvedValue(releaseResponse(preparingRelease()));

    startAutomaticUpdateChecks();
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000 - 1);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(3);
  });

  it('switches from preparation retries to hourly polling after availability', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/test/app');
    vi.mocked(net.fetch)
      .mockResolvedValueOnce(releaseResponse(preparingRelease()))
      .mockResolvedValueOnce(releaseResponse(readyRelease()))
      .mockResolvedValue(releaseResponse(readyRelease()));

    startAutomaticUpdateChecks();
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000 - 1);
    expect(net.fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(3);
  });

  it('measures the hourly interval from request completion', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/test/app');
    let finishResponse: ((response: Response) => void) | undefined;
    vi.mocked(net.fetch).mockReturnValueOnce(
      new Promise((resolve) => {
        finishResponse = resolve;
      }),
    );
    vi.mocked(net.fetch).mockResolvedValue(releaseResponse(readyRelease()));
    startAutomaticUpdateChecks();
    await flushMicrotasks();

    await vi.advanceTimersByTimeAsync(20 * 60 * 1000);
    finishResponse?.(releaseResponse(readyRelease()));
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000 - 1);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(2);
  });

  it.each(['available', 'up-to-date', 'error'] as const)(
    'schedules an hourly check after a %s result',
    async (result) => {
      vi.useFakeTimers();
      vi.stubEnv('APPIMAGE', '/app');
      vi.mocked(net.fetch).mockResolvedValueOnce(
        result === 'error'
          ? ({ ok: false, status: 503 } as Response)
          : releaseResponse(
              result === 'available' ? readyRelease() : upToDateRelease(),
            ),
      );
      vi.mocked(net.fetch).mockResolvedValue(releaseResponse(readyRelease()));

      startAutomaticUpdateChecks();
      await flushMicrotasks();
      expect(net.fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000 - 1);
      expect(net.fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await flushMicrotasks();
      expect(net.fetch).toHaveBeenCalledTimes(2);
    },
  );

  it('replaces the pending preparation retry after a manual check', async () => {
    vi.useFakeTimers();
    vi.stubEnv('APPIMAGE', '/app');
    vi.mocked(net.fetch).mockResolvedValue(releaseResponse(preparingRelease()));

    startAutomaticUpdateChecks();
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await checkForUpdates();
    expect(net.fetch).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000 - 1);
    expect(net.fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await flushMicrotasks();
    expect(net.fetch).toHaveBeenCalledTimes(3);
  });

  it('selects the installation-specific asset, including Snap and Rosetta', () => {
    expect(selectRequiredAsset('win32', 'x64', false, {})).toBe(
      'OpossumUI-for-win.exe',
    );
    expect(
      selectRequiredAsset('linux', 'x64', false, { SNAP: '/snap/app' }),
    ).toBe('OpossumUI-for-linux.snap');
    expect(
      selectRequiredAsset('linux', 'x64', false, {
        SNAP: '/snap/app',
        APPIMAGE: '/app',
      }),
    ).toBe('OpossumUI-for-linux.snap');
    expect(
      selectRequiredAsset('linux', 'x64', false, { APPIMAGE: '/app' }),
    ).toBe('OpossumUI-for-linux.AppImage');
    expect(selectRequiredAsset('darwin', 'x64', false, {})).toBe(
      'OpossumUI-for-mac-intel.zip',
    );
    expect(selectRequiredAsset('darwin', 'arm64', false, {})).toBe(
      'OpossumUI-for-mac-arm64.zip',
    );
    expect(selectRequiredAsset('darwin', 'x64', true, {})).toBe(
      'OpossumUI-for-mac-arm64.zip',
    );
  });

  it('reports preparing until the matching asset is uploaded with a nonzero size', () => {
    const release = {
      assets: [
        {
          name: 'OpossumUI-for-linux.AppImage',
          browser_download_url:
            'https://github.com/opossum-tool/OpossumUI/releases/download/OpossumUI-2027-01-02/OpossumUI-for-linux.AppImage',
          state: 'uploaded',
          size: 25,
        },
      ],
      draft: false,
      prerelease: false,
      tag_name: 'OpossumUI-2027-01-02',
    };
    const installed = installedRelease();
    const required = 'OpossumUI-for-linux.snap';
    expect(
      evaluateRelease(installed, { ...release, assets: [] }, required).status,
    ).toBe('preparing');
    expect(
      evaluateRelease(installed, { ...release, assets: [] }, required),
    ).toEqual({ status: 'preparing', installedTag: installed.tag });
    expect(
      evaluateRelease(
        installed,
        { ...release, assets: [{ ...release.assets[0], size: 0 }] },
        'OpossumUI-for-linux.AppImage',
      ).status,
    ).toBe('preparing');
    expect(
      evaluateRelease(
        installed,
        { ...release, assets: [{ ...release.assets[0], state: 'uploading' }] },
        'OpossumUI-for-linux.AppImage',
      ).status,
    ).toBe('preparing');
    expect(
      evaluateRelease(installed, release, 'OpossumUI-for-linux.AppImage'),
    ).toEqual({
      status: 'available',
      tag: 'OpossumUI-2027-01-02',
      url: release.assets[0].browser_download_url,
    });
  });

  it('returns and publishes a neutral state when the matching asset is still uploading', async () => {
    vi.stubEnv('APPIMAGE', '/app');
    const send = vi.fn();
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([
      { webContents: { send } } as unknown as Electron.BrowserWindow,
    ]);
    vi.mocked(net.fetch).mockResolvedValue(releaseResponse(preparingRelease()));

    await expect(checkForUpdates()).resolves.toEqual({
      status: 'up-to-date',
      installedTag: 'OpossumUI-2026-10-20',
    });

    expect(getUpdateState()).toEqual({
      status: 'up-to-date',
      installedTag: 'OpossumUI-2026-10-20',
    });
    expect(send).toHaveBeenNthCalledWith(
      2,
      AllowedFrontendChannels.UpdateStateChanged,
      { status: 'up-to-date', installedTag: 'OpossumUI-2026-10-20' },
    );
    expect(JSON.stringify(send.mock.calls)).not.toContain('preparing');
    expect(JSON.stringify(send.mock.calls)).not.toContain('2027-01-02');
  });

  it.each([
    ['win32', 'x64', false, {}, 'OpossumUI-for-win.exe'],
    [
      'linux',
      'x64',
      false,
      { APPIMAGE: '/app' },
      'OpossumUI-for-linux.AppImage',
    ],
    ['linux', 'x64', false, { SNAP: '/snap/app' }, 'OpossumUI-for-linux.snap'],
    ['darwin', 'x64', false, {}, 'OpossumUI-for-mac-intel.zip'],
    ['darwin', 'arm64', false, {}, 'OpossumUI-for-mac-arm64.zip'],
    ['darwin', 'x64', true, {}, 'OpossumUI-for-mac-arm64.zip'],
  ] as const)(
    'returns the exact selected asset download URL for %s (%s, Rosetta: %s)',
    (platform, architecture, rosetta, environment, selectedName) => {
      const tag = 'OpossumUI-2027-01-02';
      const url = `https://github.com/opossum-tool/OpossumUI/releases/download/${tag}/${selectedName}`;
      const assets = [
        {
          name: 'unrelated-asset.zip',
          browser_download_url: `https://github.com/opossum-tool/OpossumUI/releases/download/${tag}/unrelated-asset.zip`,
          state: 'uploaded',
          size: 10,
        },
        {
          name: selectedName,
          browser_download_url: url,
          state: 'uploaded',
          size: 25,
        },
      ];
      const required = selectRequiredAsset(
        platform,
        architecture,
        rosetta,
        environment,
      );
      expect(
        evaluateRelease(
          installedRelease(),
          {
            assets,
            draft: false,
            prerelease: false,
            tag_name: tag,
          },
          required,
        ),
      ).toEqual({ status: 'available', tag, url });
    },
  );

  it.each([
    undefined,
    'https://example.com/OpossumUI-for-win.exe',
    'https://github.com/opossum-tool/OpossumUI/releases/download/OpossumUI-2027-01-02/other.exe',
    'https://github.com/opossum-tool/OpossumUI/releases/tag/OpossumUI-2027-01-02',
  ])('rejects a missing or invalid selected asset URL: %s', (downloadUrl) => {
    const asset = {
      name: 'OpossumUI-for-win.exe',
      browser_download_url: downloadUrl ?? '',
      state: 'uploaded',
      size: 25,
    };
    expect(() =>
      evaluateRelease(
        installedRelease(),
        {
          assets: [asset],
          draft: false,
          prerelease: false,
          tag_name: 'OpossumUI-2027-01-02',
        },
        asset.name,
      ),
    ).toThrow('GitHub returned an invalid release asset download URL.');
  });

  it('uses existing error handling when selected download metadata is missing', async () => {
    vi.mocked(net.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          assets: [
            {
              name: 'OpossumUI-for-win.exe',
              size: 25,
              state: 'uploaded',
            },
          ],
          draft: false,
          prerelease: false,
          tag_name: 'OpossumUI-2027-01-02',
        }),
    } as Response);
    await expect(checkForUpdates()).resolves.toMatchObject({ status: 'error' });
  });

  it('does not report an unknown installation as a release still preparing', () => {
    expect(
      evaluateRelease(
        installedRelease('OpossumUI-2026-08-13'),
        {
          assets: [],
          draft: false,
          prerelease: false,
          tag_name: 'OpossumUI-2026-09-17',
        },
        undefined,
      ),
    ).toEqual({
      status: 'error',
      message: 'This installation has no supported update download.',
    });
  });
});

async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
}

function installedRelease(tag = 'OpossumUI-2026-10-20') {
  const version = parseReleaseTag(tag);
  if (!version) {
    throw new Error(`Invalid installed release fixture: ${tag}`);
  }
  return { tag, version };
}

function setPackaged(isPackaged: boolean): void {
  Object.defineProperty(app, 'isPackaged', {
    configurable: true,
    value: isPackaged,
  });
}

function releaseResponse(release: object): Response {
  return {
    ok: true,
    json: () => Promise.resolve(release),
  } as Response;
}

function preparingRelease() {
  return {
    assets: [],
    draft: false,
    prerelease: false,
    tag_name: 'OpossumUI-2027-01-02',
  };
}

function readyRelease() {
  const assetName = selectRequiredAsset(
    process.platform,
    process.arch,
    app.runningUnderARM64Translation,
    { ...process.env, APPIMAGE: '/app' },
  );
  if (!assetName) {
    throw new Error('The test platform must have a supported update asset.');
  }
  const tag = 'OpossumUI-2027-01-02';
  return {
    ...preparingRelease(),
    assets: [
      {
        name: assetName,
        browser_download_url: `https://github.com/opossum-tool/OpossumUI/releases/download/${tag}/${encodeURIComponent(assetName)}`,
        size: 25,
        state: 'uploaded',
      },
    ],
  };
}

function upToDateRelease() {
  return {
    assets: [],
    draft: false,
    prerelease: false,
    tag_name: 'OpossumUI-2026-10-20',
  };
}
