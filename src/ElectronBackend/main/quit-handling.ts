// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, type BrowserWindow, type Event } from 'electron';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import type { LeaveResult, QuitOptions } from '../../shared/shared-types';
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
 * unresponsive and main attempts to quit, unless a save failure blocks it.
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
    event.preventDefault();
    void confirmQuit().catch((error: unknown) => logger.error(String(error)));
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
      'The renderer did not respond to the quit request; checking pending saves.',
    );
    void confirmQuit()
      .then((result) => {
        if (
          result.status === 'blocked' &&
          !window.isDestroyed() &&
          canRendererHandleQuitRequest(window)
        ) {
          quitRequestSentAt = Date.now();
          window.webContents.send(AllowedFrontendChannels.RequestQuitApproval);
        }
      })
      .catch((error: unknown) => logger.error(String(error)));
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
 * Flushes submitted edits before quitting. Only an explicit quit without
 * saving can proceed if the flush reports a save failure.
 */
export async function confirmQuit(options?: QuitOptions): Promise<LeaveResult> {
  if (quitApproved) {
    return { status: 'completed' };
  }
  quitApproved = true;
  try {
    const client = getMainDbClient();
    if (!client.isDead()) {
      const result = await client.flushSaves();
      if (
        result.status === 'failed' &&
        options?.discardUnsavedChanges !== true
      ) {
        resetQuitState();
        return { status: 'blocked', failure: result.failure };
      }
    }
    quitFinalized = true;
    app.quit();
    return { status: 'completed' };
  } catch (error) {
    resetQuitState();
    throw error;
  }
}

function resetQuitState(): void {
  quitApproved = false;
  quitFinalized = false;
  quitRequestSentAt = null;
  quitRequestHandled = false;
}

export const resetQuitStateForTesting = resetQuitState;
