// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { WebContents } from 'electron';
import log from 'electron-log';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  ProcessingDoneEvent,
  ProcessingStartedEvent,
  ProcessingStateUpdatedEvent,
  ProcessingStateUpdatedEventLevel,
} from '../../shared/shared-types';

export class ProcessingStatusUpdater {
  readonly #webContents: WebContents;

  constructor(webContents: WebContents) {
    this.#webContents = webContents;
  }

  #sendToFrontend(message: string, level: ProcessingStateUpdatedEventLevel) {
    this.#webContents.send(AllowedFrontendChannels.ProcessingStateChanged, {
      type: 'ProcessingStateUpdated',
      date: new Date(),
      message,
      level,
    } satisfies ProcessingStateUpdatedEvent);
  }

  info(message: string) {
    this.#sendToFrontend(message, 'info');
    log.info(message);
  }

  warn(message: string) {
    this.#sendToFrontend(message, 'warn');
    log.warn(message);
  }

  error(message: string) {
    this.#sendToFrontend(message, 'error');
    log.error(message);
  }

  startProcessing() {
    this.#webContents.send(AllowedFrontendChannels.ProcessingStateChanged, {
      type: 'ProcessingStarted',
    } satisfies ProcessingStartedEvent);
  }

  endProcessing() {
    this.#webContents.send(AllowedFrontendChannels.ProcessingStateChanged, {
      type: 'ProcessingDone',
    } satisfies ProcessingDoneEvent);
  }
}
