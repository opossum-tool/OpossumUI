// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, type BrowserWindow, type Event } from 'electron';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { getMainDbClient } from '../dbProcess/dbProcessClient';
import logger from './logger';

const QUIT_REQUEST_UNRESPONSIVE_TIMEOUT_MS = 10000;

let quitApproved = false;
let quitFinalized = false;
let quitRequestSentAt: number | null = null;
let quitRequestHandled = false;

function canRendererHandleQuitRequest(window: BrowserWindow): boolean {
  const webContents = window.webContents;
  return (
    !webContents.isDestroyed() &&
    !webContents.isCrashed() &&
    !webContents.isLoading()
  );
}

/**
 * Window 'close' handler. The first close attempt is prevented and the
 * renderer is asked to check for unsaved changes. The renderer answers by
 * calling `confirmQuit` (via IpcChannel.ConfirmQuit) or by keeping the
 * window open (e.g. the user cancelled in the unsaved-changes popup).
 *
 * If the renderer never acknowledges the request, it is treated as
 * unresponsive and the app force-quits so that closing the window cannot
 * get stuck.
 */
export function handleWindowClose(window: BrowserWindow, event: Event): void {
  if (quitApproved) {
    if (!quitFinalized) {
      event.preventDefault();
      logger.info('Quit is already in progress; ignoring close attempt.');
    }
    return;
  }
  if (!canRendererHandleQuitRequest(window)) {
    return;
  }

  const now = Date.now();
  const requestTimedOut =
    quitRequestSentAt !== null &&
    !quitRequestHandled &&
    now - quitRequestSentAt > QUIT_REQUEST_UNRESPONSIVE_TIMEOUT_MS;

  event.preventDefault();
  if (requestTimedOut) {
    logger.info(
      'The renderer did not respond to the quit request; force-quitting.',
    );
    void confirmQuit();
    return;
  }

  quitRequestSentAt = now;
  quitRequestHandled = false;
  window.webContents.send(AllowedFrontendChannels.RequestQuitApproval);
}

/**
 * Called by the renderer when it has received and is handling a quit
 * request. From then on the renderer is considered responsive and quit
 * prompting never times out (the user may take any amount of time in the
 * unsaved-changes popup).
 */
export function acknowledgeQuitRequest(): void {
  quitRequestHandled = true;
}

/**
 * Called by the renderer once it is safe to quit. Resolves after every
 * tracked file-writing operation (mutations with their automatic saves,
 * manual saves, forceUnlock, split, merge, export) has been executed and
 * its write has concluded. Acting on a failed write is error handling and
 * deliberately part of future work, so tracking and recovery land
 * independently (see `waitForPendingSaves`).
 */
export async function confirmQuit(): Promise<void> {
  quitApproved = true;
  const client = getMainDbClient();
  if (!client.isDead()) {
    await client.waitForPendingSaves();
  }

  quitFinalized = true;
  app.quit();
}

export function resetQuitStateForTesting(): void {
  quitApproved = false;
  quitFinalized = false;
  quitRequestSentAt = null;
  quitRequestHandled = false;
}
