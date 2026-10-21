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
    let resolveSnapshot: ((state: UpdateState) => void) | undefined;
    vi.mocked(window.electronAPI.getUpdateState).mockReturnValue(
      new Promise((resolve) => {
        resolveSnapshot = resolve;
      }),
    );
    await renderComponent(<UpdateBanner />);
    const newerAvailable: UpdateState = {
      status: 'available',
      tag: 'OpossumUI-2030-02-01',
      url: assetUrl,
    };
    emit(AllowedFrontendChannels.UpdateStateChanged, newerAvailable);
    act(() => {
      resolveSnapshot?.(available);
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

  it('does not reopen a dismissed background release when a manual check resolves', async () => {
    let finishCheck: (result: UpdateState) => void = () => {};
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    const check = new Promise<UpdateState>((resolve) => {
      finishCheck = resolve;
    });
    vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(check);
    await renderComponent(<UpdateBanner />);

    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    emit(AllowedFrontendChannels.UpdateStateChanged, available);
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    await act(async () => {
      finishCheck(available);
      await check;
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores an older overlapping manual check result', async () => {
    const finishes: Array<(state: UpdateState) => void> = [];
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    vi.mocked(window.electronAPI.checkForUpdates).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishes.push(resolve);
        }),
    );
    await renderComponent(<UpdateBanner />);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    expect(finishes).toHaveLength(2);

    act(() => {
      finishes[0](available);
    });
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();

    act(() => {
      finishes[1](available);
    });
    expect(
      await screen.findByRole('link', { name: 'Download' }),
    ).toBeInTheDocument();
  });

  it('unsubscribes from IPC events when unmounted', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(window.electronAPI.on).mockReturnValue(unsubscribe);
    const { unmount } = await renderComponent(<UpdateBanner />);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });

  it.each<UpdateState>([
    upToDate,
    { status: 'error', message: 'network error' },
  ])(
    'keeps a closed progress banner hidden when the check returns $status',
    async (result) => {
      let finishCheck: (state: UpdateState) => void = () => {};
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
      const check = new Promise<UpdateState>((resolve) => {
        finishCheck = resolve;
      });
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(check);
      await renderComponent(<UpdateBanner />);
      emit(AllowedFrontendChannels.CheckForUpdatesRequested);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: text.updateApp.dismissed }),
      );
      await act(async () => {
        finishCheck(result);
        await check;
      });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('shows availability after progress is closed', async () => {
    let finishCheck: (state: UpdateState) => void = () => {};
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(upToDate);
    const check = new Promise<UpdateState>((resolve) => {
      finishCheck = resolve;
    });
    vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(check);
    await renderComponent(<UpdateBanner />);
    emit(AllowedFrontendChannels.CheckForUpdatesRequested);
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    await act(async () => {
      finishCheck(available);
      await check;
    });
    expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
  });
});
