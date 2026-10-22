// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';

import { AllowedFrontendChannels } from '../shared/ipc-channels';
import type { UpdateState } from '../shared/shared-types';
import { text } from '../shared/text';
import { renderApp } from './helpers/render-app';
import {
  clickTopBarViewButton,
  expectViewIsActive,
  gotoReportView,
} from './helpers/ui';

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
    await screen.findByRole('link', { name: text.updateApp.download });
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    await gotoReportView();
    await expectViewIsActive('report');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await clickTopBarViewButton('audit');
    await expectViewIsActive('audit');
    act(() => {
      sendToChannel(AllowedFrontendChannels.UpdateStateChanged, available);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
      ...available,
      tag: 'OpossumUI-2030-02-01',
    });
    expect(
      await screen.findByText(text.updateApp.available('OpossumUI-2030-02-01')),
    ).toBeInTheDocument();
  });

  it.each<UpdateState>([
    available,
    { status: 'up-to-date', installedTag: 'OpossumUI-2030-01-02' },
    { status: 'error' },
  ])(
    'shows explicit $status feedback while automatic checks are disabled',
    async (result) => {
      let finishCheck: (state: UpdateState) => void = () => {};
      const check = new Promise<UpdateState>((resolve) => {
        finishCheck = resolve;
      });
      const { sendToChannel } = await renderApp({
        userSettings: { automaticallyCheckForUpdates: false },
      });
      vi.mocked(window.electronAPI.checkForUpdates).mockReturnValue(check);
      sendToChannel(AllowedFrontendChannels.CheckForUpdatesRequested);
      expect(await screen.findByRole('progressbar')).toBeInTheDocument();
      await act(async () => {
        finishCheck(result);
        await check;
      });
      const message =
        result.status === 'available'
          ? text.updateApp.available(result.tag)
          : result.status === 'up-to-date'
            ? text.updateApp.noUpdateAvailable
            : result.status === 'error'
              ? text.updateApp.fetchFailed
              : '';
      expect(await screen.findByText(message)).toBeInTheDocument();
    },
  );

  it('applies automatic-check preference changes received from the main process', async () => {
    const { sendToChannel } = await renderApp({
      userSettings: { automaticallyCheckForUpdates: true },
    });
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
      ...available,
      tag: 'OpossumUI-2030-02-01',
    });
    expect(
      await screen.findByRole('link', { name: text.updateApp.download }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    act(() => {
      sendToChannel(AllowedFrontendChannels.UserSettingsChanged, {
        automaticallyCheckForUpdates: false,
      });
    });
    act(() => {
      sendToChannel(AllowedFrontendChannels.UpdateStateChanged, available);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    act(() => {
      sendToChannel(AllowedFrontendChannels.UserSettingsChanged, {
        automaticallyCheckForUpdates: true,
      });
    });
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, available);
    expect(
      await screen.findByRole('link', { name: text.updateApp.download }),
    ).toBeInTheDocument();
  });

  it('keeps background failures silent and preserves update availability', async () => {
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(available);
    const { sendToChannel } = await renderApp();

    expect(
      await screen.findByText(text.updateApp.available(releaseTag)),
    ).toBeInTheDocument();
    act(() => {
      sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
        status: 'error',
      });
    });

    expect(
      screen.getByText(text.updateApp.available(releaseTag)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.updateApp.fetchFailed),
    ).not.toBeInTheDocument();
  });

  it('shows update and architecture warnings with independent dismissal', async () => {
    vi.mocked(window.electronAPI.getMacArchitectureMismatch).mockResolvedValue(
      true,
    );
    vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue(available);
    await renderApp();
    expect(
      await screen.findByText(text.updateApp.available(releaseTag)),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(text.macArchitectureMismatch.warning),
    ).toBeInTheDocument();
    const dismissButtons = screen.getAllByRole('button', {
      name: text.updateApp.dismissed,
    });
    fireEvent.click(dismissButtons[0]);
    expect(
      screen.queryByText(text.updateApp.available(releaseTag)),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(text.macArchitectureMismatch.warning),
    ).toBeInTheDocument();
  });
});
