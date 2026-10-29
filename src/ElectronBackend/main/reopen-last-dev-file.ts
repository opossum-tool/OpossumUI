// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';

import { UserSettingsService } from './user-settings-service';

/**
 * Development-only convenience: when the vite watcher restarts Electron after
 * a backend code change, the app reopens the file that was open before the
 * restart so that the developer does not have to pick it again.
 *
 * The path comes from the existing `recentlyOpenedPaths` user setting, which
 * the production flow keeps up to date on every file open. A fresh dev start
 * (`OPOSSUM_ELECTRON_RESTARTED=0`, see `vite.config.mts`) and all production
 * builds never open a file on their own.
 */
export async function getDevReopenFilePath(): Promise<string | undefined> {
  if (process.env.OPOSSUM_ELECTRON_RESTARTED !== '1') {
    return undefined;
  }

  const recentlyOpenedPaths = await UserSettingsService.get(
    'recentlyOpenedPaths',
  );

  const lastOpenedFilePath = recentlyOpenedPaths?.[0];
  if (
    !lastOpenedFilePath ||
    !lastOpenedFilePath.endsWith('.opossum') ||
    !fs.existsSync(lastOpenedFilePath)
  ) {
    return undefined;
  }
  return lastOpenedFilePath;
}
