// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { AllowedFrontendChannels } from '../shared/ipc-channels';
import type { UpdateState } from '../shared/shared-types';
import { text } from '../shared/text';
import { renderApp } from '../testing/render-app';
import {
  clickTopBarViewButton,
  clickUpdateActionButton,
  dismissUpdateAlert,
  expectUpdateActionButtonVisible,
  expectUpdateAlertVisible,
  expectUpdateDownloadLinkVisible,
  expectUpdateMessage,
  expectUpdateProgressbarVisible,
  expectViewIsActive,
  gotoReportView,
} from '../testing/ui';

const releaseTag = 'OpossumUI-2030-01-02';
const downloadUrl = 'https://example.com/update.exe';
const available: UpdateState = {
  status: 'available',
  tag: releaseTag,
  url: downloadUrl,
};

describe('checking for updates in the app', () => {
  beforeEach(() => {
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue({
      status: 'up-to-date',
      installedTag: 'OpossumUI-2029-12-31',
    });
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue(available);
    vi.mocked(window.electronAPI.getMacArchitectureMismatch).mockResolvedValue(
      false,
    );
  });

  it('shows startup availability, keeps dismissal across views, then announces another release', async () => {
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(available);
    const { sendToChannel } = await renderApp();
    await expectUpdateDownloadLinkVisible(true);
    await dismissUpdateAlert();
    await gotoReportView();
    await expectViewIsActive('report');
    await expectUpdateAlertVisible(false);
    await clickTopBarViewButton('audit');
    await expectViewIsActive('audit');
    act(() => {
      sendToChannel(AllowedFrontendChannels.UpdateStateChanged, available);
    });
    await expectUpdateAlertVisible(false);
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
      ...available,
      tag: 'OpossumUI-2030-02-01',
    });
    await expectUpdateMessage(
      text.updateApp.available('OpossumUI-2030-02-01'),
      true,
    );
  });

  it.each<UpdateState>([
    available,
    { status: 'up-to-date', installedTag: 'OpossumUI-2030-01-02' },
    { status: 'error' },
  ])(
    'shows explicit $status feedback while automatic checks are disabled',
    async (result) => {
      const check = Promise.withResolvers<UpdateState>();
      const { sendToChannel } = await renderApp({
        userSettings: { automaticallyCheckForUpdates: false },
      });
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(
        check.promise,
      );
      sendToChannel(AllowedFrontendChannels.CheckForUpdatesRequested);
      await expectUpdateProgressbarVisible();
      await act(async () => {
        check.resolve(result);
        await check.promise;
      });
      const message =
        result.status === 'available'
          ? text.updateApp.available(result.tag)
          : result.status === 'up-to-date'
            ? text.updateApp.noUpdateAvailable
            : result.status === 'error'
              ? text.updateApp.fetchFailed
              : '';
      await expectUpdateMessage(message, true);
    },
  );

  it('waits for Download update before starting a transfer, then offers an explicit restart', async () => {
    vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue({
      ...available,
      canInstall: true,
    });
    vi.mocked(window.electronAPI.downloadUpdate).mockResolvedValue({
      status: 'downloading',
      tag: releaseTag,
      percent: 0,
    });
    const { sendToChannel } = await renderApp({
      userSettings: { automaticallyCheckForUpdates: false },
    });
    sendToChannel(AllowedFrontendChannels.CheckForUpdatesRequested);
    expect(window.electronAPI.downloadUpdate).not.toHaveBeenCalled();
    await expectUpdateDownloadLinkVisible(false);
    await clickUpdateActionButton(text.updateApp.downloadUpdate);
    expect(window.electronAPI.downloadUpdate).toHaveBeenCalledExactlyOnceWith(
      releaseTag,
    );
    await expectUpdateMessage(text.updateApp.downloading(0), true);
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'downloaded',
      tag: releaseTag,
    });
    await expectUpdateMessage(text.updateApp.ready, true);
    await expectUpdateActionButtonVisible(text.updateApp.restart, true);
    expect(window.electronAPI.restartAndUpdate).not.toHaveBeenCalled();
  });

  it('applies automatic-check preference changes received from the main process', async () => {
    const { sendToChannel } = await renderApp({
      userSettings: { automaticallyCheckForUpdates: true },
    });
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
      ...available,
      tag: 'OpossumUI-2030-02-01',
    });
    await expectUpdateDownloadLinkVisible(true);
    await dismissUpdateAlert();
    act(() => {
      sendToChannel(AllowedFrontendChannels.UserSettingsChanged, {
        automaticallyCheckForUpdates: false,
      });
    });
    act(() => {
      sendToChannel(AllowedFrontendChannels.UpdateStateChanged, available);
    });
    await expectUpdateAlertVisible(false);
    act(() => {
      sendToChannel(AllowedFrontendChannels.UserSettingsChanged, {
        automaticallyCheckForUpdates: true,
      });
    });
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, available);
    await expectUpdateDownloadLinkVisible(true);
  });

  it.each<UpdateState>([
    { status: 'error' },
    { status: 'error', reason: 'unsupported-installation' },
    { status: 'error', reason: 'unknown-installed-version' },
  ])(
    'keeps availability visible after a background failure: $reason',
    async (result) => {
      vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(available);
      const { sendToChannel } = await renderApp();

      await expectUpdateMessage(text.updateApp.available(releaseTag), true);
      act(() => {
        sendToChannel(AllowedFrontendChannels.UpdateStateChanged, result);
      });

      await expectUpdateMessage(text.updateApp.available(releaseTag), true);
      await expectUpdateAlertVisible(true);
      await expectUpdateMessage(text.updateApp.fetchFailed, false);
      await expectUpdateMessage(text.updateApp.unsupportedInstallation, false);
      await expectUpdateMessage(text.updateApp.unknownInstalledVersion, false);
    },
  );

  it('shows update and architecture warnings with independent dismissal', async () => {
    vi.mocked(window.electronAPI.getMacArchitectureMismatch).mockResolvedValue(
      true,
    );
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(available);
    await renderApp();
    await expectUpdateMessage(text.updateApp.available(releaseTag), true);
    await expectUpdateMessage(text.macArchitectureMismatch.warning, true);
    await dismissUpdateAlert();
    await expectUpdateMessage(text.updateApp.available(releaseTag), false);
    await expectUpdateMessage(text.macArchitectureMismatch.warning, true);
  });
});
