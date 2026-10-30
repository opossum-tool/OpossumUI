// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { AllowedFrontendChannels } from '../shared/ipc-channels';
import {
  getReleaseAssetDownloadUrl,
  UPDATE_ASSET_NAMES,
} from '../shared/release-assets';
import { text } from '../shared/text';
import { renderApp } from './helpers/render-app';
import { expectViewIsActive, gotoReportView } from './helpers/ui';

describe('checking for updates through the Help menu', () => {
  it.each(['audit', 'report'] as const)(
    'shows and dismisses the real update failure banner in the %s view',
    async (view) => {
      const { sendToChannel, requestedUpdateUrls } = await renderApp({
        updates: {
          installedVersion: '2026.1020.0',
          response: { status: 503, body: 'Unavailable' },
        },
        userSettings: { automaticallyCheckForUpdates: false },
      });
      if (view === 'report') {
        await gotoReportView();
      }
      await expectViewIsActive(view);

      sendToChannel(AllowedFrontendChannels.CheckForUpdatesRequested);
      expect(
        await screen.findByText(text.updateApp.fetchFailed),
      ).toBeInTheDocument();

      expect(requestedUpdateUrls).toEqual([
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      ]);

      fireEvent.click(
        screen.getByRole('button', { name: text.updateApp.dismissed }),
      );
      expect(
        screen.queryByText(text.updateApp.fetchFailed),
      ).not.toBeInTheDocument();
    },
  );

  it('keeps a server failure visible after the manual check completes and lets the user retry', async () => {
    const response = { status: 503, body: 'Unavailable' };
    const { sendToChannel, requestedUpdateUrls } = await renderApp({
      updates: {
        installedVersion: '2026.1020.0',
        response,
      },
      userSettings: { automaticallyCheckForUpdates: false },
    });
    sendToChannel(AllowedFrontendChannels.CheckForUpdatesRequested);
    expect(
      await screen.findByText(text.updateApp.fetchFailed),
    ).toBeInTheDocument();
    // A final event delivered after the invoke reply must not hide the error.
    sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'error',
    });
    expect(screen.getByText(text.updateApp.fetchFailed)).toBeInTheDocument();

    response.status = 200;
    response.body = JSON.stringify({
      tag_name: 'OpossumUI-2026-10-20',
      draft: false,
      prerelease: false,
      assets: [],
    });
    fireEvent.click(screen.getByRole('button', { name: text.updateApp.retry }));
    expect(
      await screen.findByText(text.updateApp.noUpdateAvailable),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.updateApp.fetchFailed),
    ).not.toBeInTheDocument();
    expect(requestedUpdateUrls).toEqual([
      'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
    ]);
  });

  it('shows the failure banner when a successful response contains invalid release data', async () => {
    const { sendToChannel, requestedUpdateUrls } = await renderApp({
      updates: {
        installedVersion: '2026.1020.0',
        response: { status: 200, body: 'invalid JSON' },
      },
      userSettings: { automaticallyCheckForUpdates: false },
    });
    await expectViewIsActive('audit');

    sendToChannel(AllowedFrontendChannels.CheckForUpdatesRequested);
    expect(
      await screen.findByText(text.updateApp.fetchFailed),
    ).toBeInTheDocument();
    expect(requestedUpdateUrls).toEqual([
      'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    expect(
      screen.queryByText(text.updateApp.fetchFailed),
    ).not.toBeInTheDocument();
  });

  it('shows an available release from the real update service', async () => {
    const tag = 'OpossumUI-2026-10-21';
    const { sendToChannel, requestedUpdateUrls } = await renderApp({
      updates: {
        installedVersion: '2026.1020.0',
        response: {
          status: 200,
          body: JSON.stringify({
            tag_name: tag,
            draft: false,
            prerelease: false,
            assets: Object.values(UPDATE_ASSET_NAMES).map((name) => ({
              name,
              browser_download_url: getReleaseAssetDownloadUrl(tag, name),
              size: 100,
              state: 'uploaded',
            })),
          }),
        },
      },
      userSettings: { automaticallyCheckForUpdates: false },
    });
    await expectViewIsActive('audit');

    sendToChannel(AllowedFrontendChannels.CheckForUpdatesRequested);
    expect(
      await screen.findByText(text.updateApp.available(tag)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: text.updateApp.download }),
    ).toBeInTheDocument();
    expect(requestedUpdateUrls).toEqual([
      'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: text.updateApp.dismissed }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
