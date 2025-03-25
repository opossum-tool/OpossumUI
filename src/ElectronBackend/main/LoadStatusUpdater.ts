// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { DataLoadEvent, DataLoadEventLevel } from '../../shared/shared-types';

export class LoadStatusUpdater {
  readonly #mainWindow: BrowserWindow;
  constructor(mainWindow: BrowserWindow) {
    this.#mainWindow = mainWindow;
  }

  #sendToFrontend(message: string, level: DataLoadEventLevel) {
    this.#mainWindow.webContents.send(AllowedFrontendChannels.DataLoadEvent, {
      date: new Date(),
      message,
      level,
    } satisfies DataLoadEvent);
  }

  info(message: string) {
    this.#sendToFrontend(message, 'info');
  }
}
