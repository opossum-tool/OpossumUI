// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { net } from 'electron';

import { sendToRenderers } from '../../ElectronBackend/main/send-to-renderers';
import {
  checkForUpdates,
  getUpdateState,
  initializeUpdateService,
  stopAutomaticUpdateChecks,
} from '../../ElectronBackend/main/update-service';
import type { AllowedFrontendChannels } from '../../shared/ipc-channels';

vi.mock('electron', () => ({
  app: { isPackaged: true, runningUnderARM64Translation: false },
  net: { fetch: vi.fn() },
}));
vi.mock('../../ElectronBackend/main/send-to-renderers', () => ({
  sendToRenderers: vi.fn(),
}));

export interface UpdatesFixture {
  installedTag: string;
  response: { status: number; body?: string };
}

let cleanupUpdates: (() => Promise<void>) | undefined;

export function setUpUpdates(
  fixture: UpdatesFixture,
  sendToChannel: (
    channel: AllowedFrontendChannels,
    ...args: Array<unknown>
  ) => void,
): string[] {
  if (cleanupUpdates) {
    throw new Error('An update fixture is already active');
  }
  initializeUpdateService(fixture.installedTag);
  const previousAppImage = process.env.APPIMAGE;
  const previousSnap = process.env.SNAP;
  const check = vi.mocked(window.electronAPI.checkForUpdates);
  const getState = vi.mocked(window.electronAPI.getUpdateState);
  const fetch = vi.mocked(net.fetch);
  const send = vi.mocked(sendToRenderers);
  const previousCheck = check.getMockImplementation();
  const previousGetState = getState.getMockImplementation();
  const previousFetch = fetch.getMockImplementation();
  const previousSend = send.getMockImplementation();
  process.env.APPIMAGE = '/test/OpossumUI.AppImage';
  delete process.env.SNAP;

  const requestedUrls: string[] = [];
  fetch.mockImplementation((url) => {
    requestedUrls.push(String(url));
    return Promise.resolve(
      new Response(fixture.response.body, {
        status: fixture.response.status,
      }),
    );
  });
  send.mockImplementation(sendToChannel);
  let pendingCheck: ReturnType<typeof checkForUpdates> | undefined;
  check.mockImplementation(() => {
    pendingCheck = checkForUpdates();
    return pendingCheck;
  });
  getState.mockImplementation(() => Promise.resolve(getUpdateState()));

  cleanupUpdates = async () => {
    stopAutomaticUpdateChecks();
    try {
      await Promise.allSettled(pendingCheck ? [pendingCheck] : []);
    } finally {
      check.mockReset();
      if (previousCheck) {
        check.mockImplementation(previousCheck);
      }
      getState.mockReset();
      if (previousGetState) {
        getState.mockImplementation(previousGetState);
      }
      fetch.mockReset();
      if (previousFetch) {
        fetch.mockImplementation(previousFetch);
      }
      send.mockReset();
      if (previousSend) {
        send.mockImplementation(previousSend);
      }
      if (previousAppImage === undefined) {
        delete process.env.APPIMAGE;
      } else {
        process.env.APPIMAGE = previousAppImage;
      }
      if (previousSnap === undefined) {
        delete process.env.SNAP;
      } else {
        process.env.SNAP = previousSnap;
      }
      cleanupUpdates = undefined;
    }
  };
  return requestedUrls;
}

afterEach(async () => {
  await cleanupUpdates?.();
});
