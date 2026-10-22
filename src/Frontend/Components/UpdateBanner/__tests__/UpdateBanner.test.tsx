// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import type { UpdateState } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { UpdateBanner } from '../UpdateBanner';

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
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();

    await act(async () => {
      secondCheck.resolve(available);
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

  it('bypasses dismissal for manual feedback while preserving background suppression', async () => {
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
    expect(
      screen.getByText(text.updateApp.noUpdateAvailable),
    ).toBeInTheDocument();

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

  it.each<UpdateState>([available, upToDate, { status: 'error' }])(
    'hides dismissed manual $status feedback without suppressing later automatic availability',
    async (result) => {
      const check = Promise.withResolvers<UpdateState>();
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        check.promise,
      );
      await renderComponent(<UpdateBanner />);
      emit(AllowedFrontendChannels.CheckForUpdatesRequested);
      emit(AllowedFrontendChannels.UpdateStateChanged, available);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: text.updateApp.dismissed }),
      );
      emit(AllowedFrontendChannels.UpdateStateChanged, available);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await act(async () => {
        check.resolve(result);
        await check.promise;
      });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      emit(AllowedFrontendChannels.UpdateStateChanged, available);
      expect(
        screen.getByRole('link', { name: 'Download' }),
      ).toBeInTheDocument();
    },
  );
});
