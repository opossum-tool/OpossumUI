// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';
import log from 'electron-log';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { Log } from '../../shared/shared-types';

class Logger {
  private sendLogToRenderer(
    message: string,
    { level }: Pick<Log, 'level'>,
  ): void {
    BrowserWindow.getFocusedWindow()?.webContents.send(
      AllowedFrontendChannels.Logging,
      {
        date: new Date(),
        message,
        level,
      } satisfies Log,
    );
  }

  public info(message: string): void {
    log.info(message);
    this.sendLogToRenderer(message, { level: 'info' });
  }

  public warn(message: string): void {
    log.warn(message);
    this.sendLogToRenderer(message, { level: 'warn' });
  }

  public error(message: string): void {
    log.error(message);
    this.sendLogToRenderer(message, { level: 'error' });
  }
}

const logger = new Logger();

export default logger;
