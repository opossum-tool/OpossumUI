// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import type { UpdateState } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { renderComponent, renderHook } from '../../../test-helpers/render';
import { UpdateBanner } from '../UpdateBanner';
import { useUpdateState } from '../use-update-state';

const tag = 'OpossumUI-2030-01-02';
const assetUrl = `https://github.com/opossum-tool/OpossumUI/releases/download/${tag}/OpossumUI-for-win.exe`;
const available: UpdateState = { status: 'available', tag, url: assetUrl };
const upToDate: UpdateState = { status: 'up-to-date', installedTag: tag };

describe('UpdateBanner', () => {
  const listeners = new Map<
    AllowedFrontendChannels,
    (event: IpcRendererEvent, ...args: Array<unknown>) => void
  >();

  function emit(channel: AllowedFrontendChannels, state?: UpdateState) {
    act(() => {
      listeners.get(channel)?.({} as IpcRendererEvent, state);
    });
  }

  beforeEach(() => {
    listeners.clear();
    vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
      listeners.set(
        channel,
        listener as (event: IpcRendererEvent, ...args: Array<unknown>) => void,
      );
      return vi.fn();
    });
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(available);
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue(available);
  });

  it('opens the asset download and dismisses the release for this mount', async () => {
    await renderComponent(<UpdateBanner />);

    const downloadLink = await screen.findByRole('link', { name: 'Download' });
    fireEvent.click(downloadLink);
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(assetUrl);

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss update notification' }),
    );
    expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers an explicit download button and follows progress to a restart button', async () => {
    const downloadable: UpdateState = { ...available, canInstall: true };
    const pending = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(
      downloadable,
    );
    vi.mocked(window.electronAPI.downloadUpdate).mockReturnValue(
      pending.promise,
    );
    await renderComponent(<UpdateBanner />);
    const download = await screen.findByRole('button', {
      name: text.updateApp.downloadUpdate,
    });
    expect(window.electronAPI.downloadUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    fireEvent.click(download);
    expect(window.electronAPI.downloadUpdate).toHaveBeenCalledExactlyOnceWith(
      tag,
    );
    expect(screen.getByText(text.updateApp.downloading(0))).toBeInTheDocument();
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'downloading',
      tag,
      percent: 50,
    });
    await act(async () => {
      pending.resolve(downloadable);
      await pending.promise;
    });
    expect(
      screen.getByText(text.updateApp.downloading(50)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: text.updateApp.downloading(50) }),
    ).toHaveAttribute('aria-valuenow', '50');
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'downloaded',
      tag,
    });
    expect(screen.getByText(text.updateApp.ready)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: text.updateApp.restart }),
    ).toBeInTheDocument();
    expect(window.electronAPI.restartAndUpdate).not.toHaveBeenCalled();
  });

  it('retries a backend-reported transfer failure for the same release', async () => {
    const downloadable: UpdateState = { ...available, canInstall: true };
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(
      downloadable,
    );
    vi.mocked(window.electronAPI.downloadUpdate)
      .mockResolvedValueOnce({
        status: 'error',
        retry: 'download',
        message: text.updateApp.downloadFailed,
      })
      .mockResolvedValueOnce({ status: 'downloaded', tag });
    await renderComponent(<UpdateBanner />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: text.updateApp.downloadUpdate,
      }),
    );
    expect(
      await screen.findByText(text.updateApp.downloadFailed),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: text.updateApp.retry }));
    expect(await screen.findByText(text.updateApp.ready)).toBeInTheDocument();
    expect(vi.mocked(window.electronAPI.downloadUpdate).mock.calls).toEqual([
      [tag],
      [tag],
    ]);
    expect(window.electronAPI.checkForUpdates).not.toHaveBeenCalled();
  });

  it('checks for updates after a rejected download request', async () => {
    const downloadable: UpdateState = { ...available, canInstall: true };
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(
      downloadable,
    );
    vi.mocked(window.electronAPI.downloadUpdate).mockRejectedValueOnce(
      new Error('IPC disconnected'),
    );
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValueOnce(
      downloadable,
    );
    await renderComponent(<UpdateBanner />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: text.updateApp.downloadUpdate,
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: text.updateApp.retry }),
    );

    expect(window.electronAPI.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.downloadUpdate).toHaveBeenCalledExactlyOnceWith(
      tag,
    );
    expect(
      await screen.findByRole('button', {
        name: text.updateApp.downloadUpdate,
      }),
    ).toBeInTheDocument();
  });

  it('does not download when an available update is dismissed', async () => {
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue({
      ...available,
      canInstall: true,
    });
    await renderComponent(<UpdateBanner />);
    await screen.findByRole('button', { name: text.updateApp.downloadUpdate });
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(window.electronAPI.downloadUpdate).not.toHaveBeenCalled();
  });

  it('does not let a stale available startup snapshot overwrite a newer release event', async () => {
    const snapshot = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.getUpdateState).mockReturnValue(
      snapshot.promise,
    );
    await renderComponent(<UpdateBanner />);
    const newerAvailable: UpdateState = {
      status: 'available',
      tag: 'OpossumUI-2030-02-01',
      url: assetUrl,
    };
    emit(AllowedFrontendChannels.UpdateStateChanged, newerAvailable);
    await act(async () => {
      snapshot.resolve(available);
      await snapshot.promise;
    });

    expect(
      await screen.findByText(text.updateApp.available(newerAvailable.tag)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.updateApp.available(tag)),
    ).not.toBeInTheDocument();
  });

  it('resets session dismissal after remount', async () => {
    const { unmount } = await renderComponent(<UpdateBanner />);
    await screen.findByRole('link', { name: 'Download' });
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    unmount();
    await renderComponent(<UpdateBanner />);
    expect(
      await screen.findByRole('link', { name: 'Download' }),
    ).toBeInTheDocument();
  });

  it('ignores an older overlapping manual check result', async () => {
    const firstCheck = Promise.withResolvers<UpdateState>();
    const secondCheck = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    vi.mocked(window.electronAPI.checkForUpdates)
      .mockReturnValueOnce(firstCheck.promise)
      .mockReturnValueOnce(secondCheck.promise);
    await renderComponent(<UpdateBanner />);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);

    await act(async () => {
      firstCheck.resolve(available);
      await firstCheck.promise;
    });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();

    await act(async () => {
      secondCheck.resolve(upToDate);
      await secondCheck.promise;
    });
    expect(
      await screen.findByRole('link', { name: 'Download' }),
    ).toBeInTheDocument();
  });

  it('preserves the latest feedback when an older overlapping request resolves last', async () => {
    const firstCheck = Promise.withResolvers<UpdateState>();
    const secondCheck = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    vi.mocked(window.electronAPI.checkForUpdates)
      .mockReturnValueOnce(firstCheck.promise)
      .mockReturnValueOnce(secondCheck.promise);
    await renderComponent(<UpdateBanner />);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);

    await act(async () => {
      secondCheck.resolve(upToDate);
      await secondCheck.promise;
    });
    expect(
      screen.getByText(text.updateApp.noUpdateAvailable),
    ).toBeInTheDocument();
    await act(async () => {
      firstCheck.resolve(available);
      await firstCheck.promise;
    });
    expect(
      screen.getByText(text.updateApp.noUpdateAvailable),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('preserves completed manual feedback when a stale startup snapshot arrives', async () => {
    const snapshot = Promise.withResolvers<UpdateState>();
    const check = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.getUpdateState).mockReturnValue(
      snapshot.promise,
    );
    vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
      check.promise,
    );
    await renderComponent(<UpdateBanner />);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    await act(async () => {
      check.resolve(upToDate);
      await check.promise;
    });
    expect(
      screen.getByText(text.updateApp.noUpdateAvailable),
    ).toBeInTheDocument();

    await act(async () => {
      snapshot.resolve(available);
      await snapshot.promise;
    });
    expect(
      screen.getByText(text.updateApp.noUpdateAvailable),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('clears release dismissal on a manual check so subsequent events appear', async () => {
    await renderComponent(<UpdateBanner />);
    await screen.findByRole('link', { name: 'Download' });
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValueOnce(
      upToDate,
    );
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    await screen.findByText(text.updateApp.noUpdateAvailable);
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();

    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    expect(
      await screen.findByRole('link', { name: 'Download' }),
    ).toBeInTheDocument();
  });

  it.each([false, true])(
    'recovers from a rejected manual invoke with progress dismissed: %s',
    async (dismissed) => {
      const check = Promise.withResolvers<UpdateState>();
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        check.promise,
      );
      await renderComponent(<UpdateBanner />);
      emit(AllowedFrontendChannels.CheckForUpdatesRequested);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      if (dismissed) {
        fireEvent.click(
          screen.getByRole('button', { name: text.updateApp.dismissed }),
        );
      }
      await act(async () => {
        check.reject(new Error('IPC invoke failed'));
        await check.promise.catch(() => {});
      });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryAllByText(text.updateApp.fetchFailed)).toHaveLength(
        dismissed ? 0 : 1,
      );
      emit(AllowedFrontendChannels.UpdateStateChanged, available);
      expect(
        screen.getByRole('link', { name: 'Download' }),
      ).toBeInTheDocument();
    },
  );

  it('unsubscribes from IPC events when unmounted', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(window.electronAPI.on).mockReturnValue(unsubscribe);
    const { unmount } = await renderComponent(<UpdateBanner />);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });

  it.each<UpdateState>([
    { status: 'error' },
    { status: 'error', reason: 'unsupported-installation' },
    { status: 'error', reason: 'unknown-installed-version' },
    upToDate,
  ])(
    'preserves manual feedback when the final $status event arrives after the invoke response',
    async (result) => {
      const check = Promise.withResolvers<UpdateState>();
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        check.promise,
      );
      const { result: hook } = await renderHook(() => useUpdateState());
      act(() => {
        void hook.current.checkForUpdates();
      });
      emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'checking' });
      await act(async () => {
        check.resolve(result);
        await check.promise;
      });
      // Electron can deliver the invoke reply before the final state event.
      emit(AllowedFrontendChannels.UpdateStateChanged, result);
      expect(hook.current.updateState).toEqual(result);
      expect(hook.current.visible).toBe(true);
      // Duplicate notifications must not hide the result either.
      emit(AllowedFrontendChannels.UpdateStateChanged, result);
      expect(hook.current.visible).toBe(true);
      act(() => hook.current.dismiss());
      emit(AllowedFrontendChannels.UpdateStateChanged, result);
      expect(hook.current.visible).toBe(false);
      // A subsequent background check still keeps ordinary feedback quiet.
      emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'checking' });
      emit(AllowedFrontendChannels.UpdateStateChanged, result);
      expect(hook.current.visible).toBe(false);
    },
  );

  it.each(['before reply', 'after reply'])(
    'ignores background checking and check failures %s without losing manual feedback',
    async (timing) => {
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
      const pending = Promise.withResolvers<UpdateState>();
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        pending.promise,
      );
      const { result } = await renderHook(() => useUpdateState());
      act(() => {
        void result.current.checkForUpdates();
      });
      const error: UpdateState = {
        status: 'error',
        message: 'Manual check failed',
      };
      const backgroundEvents = () => {
        emit(AllowedFrontendChannels.UpdateStateChanged, {
          status: 'checking',
        });
        emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'error' });
        emit(AllowedFrontendChannels.UpdateStateChanged, upToDate);
      };
      if (timing === 'before reply') {
        backgroundEvents();
      }
      expect(result.current.updateState).toEqual({ status: 'checking' });
      await act(async () => {
        pending.resolve(error);
        await pending.promise;
      });
      if (timing === 'after reply') {
        backgroundEvents();
      }
      expect(result.current.updateState).toEqual(error);
      expect(result.current.visible).toBe(true);
    },
  );

  it.each<UpdateState>([available, upToDate, { status: 'error' }])(
    'shows manual $status replies even when automatic checks are disabled',
    async (reply) => {
      vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue(reply);
      const { result } = await renderHook(() => useUpdateState(), {
        actions: [setUserSetting({ automaticallyCheckForUpdates: false })],
      });
      await act(async () => {
        await result.current.checkForUpdates();
      });
      expect(result.current.updateState).toEqual(reply);
      expect(result.current.visible).toBe(true);
    },
  );

  it('leaves existing availability alone when a background check or startup snapshot fails', async () => {
    const snapshot = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.getUpdateState).mockReturnValue(
      snapshot.promise,
    );
    const { result } = await renderHook(() => useUpdateState());
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'checking' });
    emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'error' });
    await act(async () => {
      snapshot.reject(new Error('Offline'));
      await snapshot.promise.catch(() => undefined);
    });
    expect(result.current.updateState).toEqual(available);
    expect(result.current.visible).toBe(true);
  });

  it('explains unsupported installations without suggesting a retry', async () => {
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue({
      status: 'error',
      reason: 'unsupported-installation',
    });
    await renderComponent(<UpdateBanner />);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);

    expect(
      await screen.findByText(text.updateApp.unsupportedInstallation),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.updateApp.fetchFailed),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('explains an unknown version and links to the releases page', async () => {
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue({
      status: 'error',
      reason: 'unknown-installed-version',
    });
    await renderComponent(<UpdateBanner />);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);

    expect(
      await screen.findByText(text.updateApp.unknownInstalledVersion),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.updateApp.fetchFailed),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('link', { name: text.updateApp.viewReleases }),
    );
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(
      'https://github.com/opossum-tool/OpossumUI/releases',
    );
  });

  it.each<UpdateState>([
    available,
    upToDate,
    { status: 'error' },
    { status: 'error', reason: 'unsupported-installation' },
    { status: 'error', reason: 'unknown-installed-version' },
  ])(
    'hides dismissed manual $status feedback without suppressing later automatic availability',
    async (result) => {
      const check = Promise.withResolvers<UpdateState>();
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        check.promise,
      );
      await renderComponent(<UpdateBanner />);
      emit(AllowedFrontendChannels.CheckForUpdatesRequested);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: text.updateApp.dismissed }),
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await act(async () => {
        check.resolve(result);
        await check.promise;
      });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'checking' });
      emit(AllowedFrontendChannels.UpdateStateChanged, available);
      expect(
        screen.getByRole('link', { name: 'Download' }),
      ).toBeInTheDocument();
    },
  );

  it('shows progress and completion after manually checking a dismissed download', async () => {
    const downloading: UpdateState = {
      status: 'downloading',
      tag,
      percent: 10,
    };
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(downloading);
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue(
      downloading,
    );
    await renderComponent(<UpdateBanner />);
    await screen.findByText(text.updateApp.downloading(10));
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      ...downloading,
      percent: 40,
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    await screen.findByText(text.updateApp.downloading(10));
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      ...downloading,
      percent: 75,
    });
    expect(
      screen.getByText(text.updateApp.downloading(75)),
    ).toBeInTheDocument();
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'downloaded',
      tag,
    });
    expect(
      screen.getByRole('button', { name: text.updateApp.restart }),
    ).toBeInTheDocument();
  });

  it('shows an asynchronous installer error after checking a dismissed release and restarting', async () => {
    const downloaded: UpdateState = { status: 'downloaded', tag };
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(downloaded);
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue(downloaded);
    await renderComponent(<UpdateBanner />);
    await screen.findByRole('button', { name: text.updateApp.restart });
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    fireEvent.click(
      await screen.findByRole('button', { name: text.updateApp.restart }),
    );
    expect(window.electronAPI.restartAndUpdate).toHaveBeenCalledTimes(1);
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'restarting',
      tag,
    });
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      ...downloaded,
      error: 'Installer failed',
    });
    expect(screen.getByText('Installer failed')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: text.updateApp.restart }),
    ).toBeInTheDocument();
  });

  it('updates hidden state and suppresses the dismissed release, including its download errors', async () => {
    const downloaded: UpdateState = { status: 'downloaded', tag };
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(downloaded);
    const { result } = await renderHook(() => useUpdateState());
    await waitFor(() => expect(result.current.updateState).toEqual(downloaded));
    act(() => result.current.dismiss());
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      ...downloaded,
      error: 'Installer failed',
    });
    expect(result.current.updateState).toEqual({
      ...downloaded,
      error: 'Installer failed',
    });
    expect(result.current.visible).toBe(false);
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'error',
      retry: 'download',
      message: 'Download failed',
    });
    expect(result.current.updateState).toEqual({
      status: 'error',
      retry: 'download',
      message: 'Download failed',
    });
    expect(result.current.visible).toBe(false);
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      ...downloaded,
      tag: 'OpossumUI-2030-02-01',
    });
    expect(result.current.updateState).toEqual({
      ...downloaded,
      tag: 'OpossumUI-2030-02-01',
    });
    expect(result.current.visible).toBe(true);
  });

  it('accepts background availability only when automatic checks are enabled', async () => {
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    const { result, store } = await renderHook(() => useUpdateState(), {
      actions: [setUserSetting({ automaticallyCheckForUpdates: false })],
    });
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    expect(result.current.updateState).toBeNull();
    expect(result.current.visible).toBe(false);
    act(() => {
      store.dispatch(setUserSetting({ automaticallyCheckForUpdates: true }));
    });
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    expect(result.current.updateState).toEqual(available);
    expect(result.current.visible).toBe(true);
    expect(window.electronAPI.getUpdateState).toHaveBeenCalledTimes(1);
  });

  it.each(['Help menu', 'Retry'])(
    'uses the same explicit-check feedback for %s',
    async (trigger) => {
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue({
        status: 'error',
        retry: 'download',
      });
      const pending = Promise.withResolvers<UpdateState>();
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        pending.promise,
      );
      await renderComponent(<UpdateBanner />);
      await screen.findByRole('button', { name: text.updateApp.retry });
      if (trigger === 'Retry') {
        fireEvent.click(
          screen.getByRole('button', { name: text.updateApp.retry }),
        );
      } else {
        emit(AllowedFrontendChannels.CheckForUpdatesRequested);
      }
      expect(window.electronAPI.checkForUpdates).toHaveBeenCalledTimes(1);
      expect(screen.getByText(text.updateApp.loading)).toBeInTheDocument();
      emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'checking' });
      emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'error' });
      await act(async () => {
        pending.reject(new Error('Offline'));
        await pending.promise.catch(() => undefined);
      });
      emit(AllowedFrontendChannels.UpdateStateChanged, { status: 'checking' });
      emit(AllowedFrontendChannels.UpdateStateChanged, upToDate);
      expect(screen.getByText(text.updateApp.fetchFailed)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: text.updateApp.retry }),
      ).toBeInTheDocument();
    },
  );

  it('clears release dismissal through Retry before later installer events', async () => {
    await renderComponent(<UpdateBanner />);
    await screen.findByRole('link', { name: text.updateApp.download });
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'downloaded',
      tag: 'OpossumUI-2030-02-01',
    });
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'error',
      retry: 'download',
    });
    const pending = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.downloadUpdate).mockReturnValue(
      pending.promise,
    );
    fireEvent.click(screen.getByRole('button', { name: text.updateApp.retry }));
    expect(screen.getByText(text.updateApp.downloading(0))).toBeInTheDocument();
    emit(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'downloading',
      tag,
      percent: 60,
    });
    await act(async () => {
      pending.resolve(upToDate);
      await pending.promise;
    });
    expect(
      screen.getByText(text.updateApp.downloading(60)),
    ).toBeInTheDocument();
  });

  it.each(['success', 'failure'])(
    'keeps a newer event when an explicit request finishes with %s',
    async (outcome) => {
      const pending = Promise.withResolvers<UpdateState>();
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        pending.promise,
      );
      await renderComponent(<UpdateBanner />);
      emit(AllowedFrontendChannels.CheckForUpdatesRequested);
      emit(AllowedFrontendChannels.UpdateStateChanged, {
        status: 'downloaded',
        tag,
      });
      await act(async () => {
        if (outcome === 'success') {
          pending.resolve(upToDate);
        } else {
          pending.reject(new Error('Offline'));
        }
        await pending.promise.catch(() => undefined);
      });
      expect(
        screen.getByRole('button', { name: text.updateApp.restart }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(text.updateApp.fetchFailed),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(text.updateApp.noUpdateAvailable),
      ).not.toBeInTheDocument();
    },
  );

  it('continues updating hidden state after dismissing a pending manual check', async () => {
    const pending = Promise.withResolvers<UpdateState>();
    vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
      pending.promise,
    );
    const { result } = await renderHook(() => useUpdateState());
    act(() => {
      void result.current.checkForUpdates();
    });
    act(() => result.current.dismiss());
    const progress: UpdateState = { status: 'downloading', tag, percent: 30 };
    emit(AllowedFrontendChannels.UpdateStateChanged, progress);
    expect(result.current.updateState).toEqual(progress);
    expect(result.current.visible).toBe(false);
    await act(async () => {
      pending.resolve(upToDate);
      await pending.promise;
    });
    expect(result.current.updateState).toEqual(progress);
    expect(result.current.visible).toBe(false);
  });
});
