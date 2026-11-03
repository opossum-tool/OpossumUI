// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, type BrowserWindow, type Event } from 'electron';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { getMainDbClient } from '../dbProcess/dbProcessClient';
import { showListenerErrorInMessageBox } from '../errorHandling/errorHandling';
import { getGlobalBackendState } from './globalBackendState';
import logger from './logger';

// Once the renderer acknowledged a quit request, it is considered alive and
// the user may take as long as they want in the unsaved-changes popup. Only
// if the renderer never acknowledges the request at all, the renderer is
// treated as unresponsive and the app force-quits on repeated close attempts.
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
      // The quit is confirmed but the final save is still in flight; ignore
      // duplicate close attempts so that the window cannot close mid-write.
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
    void confirmQuit(window, { force: true });
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
 * Called by the renderer once it is safe to quit (no unsaved changes left).
 * Awaits all pending requests of the DB process, then the DB process's
 * mutation registry (every mutation has been executed and its automatic
 * file write has concluded), and finally writes the current state of the
 * loaded project to file before quitting.
 *
 * For file-writing operations outside `executeCommand` (forceUnlock,
 * splitOpossumFile, mergeOpossumFiles) the awaited request itself covers
 * the write, so `whenIdle` is what settles them.
 *
 * The final saveFile always writes: automatic saves are fire-and-forget,
 * and a failure there is only logged. This awaited save is the safety net
 * that guarantees the file on disk is up to date when the app quits. Its
 * failure keeps the app open instead of losing data on quit.
 */
export async function confirmQuit(
  window: BrowserWindow,
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  quitApproved = true;
  const client = getMainDbClient();
  await client.whenIdle();
  if (!client.isDead()) {
    await client.whenMutationsSettled();
  }

  const globalBackendState = getGlobalBackendState();
  const projectIsLoaded = Boolean(
    globalBackendState.projectId && globalBackendState.opossumFilePath,
  );
  if (projectIsLoaded && !client.isDead()) {
    try {
      await client.saveFile({
        projectId: globalBackendState.projectId as string,
        opossumFilePath: globalBackendState.opossumFilePath as string,
      });
    } catch (error) {
      if (force) {
        quitFinalized = true;
        app.quit();
        return;
      }
      // The final write failed; keep the app open so that the user can
      // retry closing it. Tell the renderer so it can clear its
      // saving-before-quit indicator.
      quitApproved = false;
      quitRequestSentAt = null;
      quitRequestHandled = false;
      if (
        !window.webContents.isDestroyed() &&
        !window.webContents.isCrashed()
      ) {
        window.webContents.send(AllowedFrontendChannels.QuitSaveFailed);
      }
      await showListenerErrorInMessageBox(window, error);
      return;
    }
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
