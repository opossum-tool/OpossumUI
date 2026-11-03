// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';

import { UserSettingsService } from './user-settings-service';

/**
 * Returns the most recently opened `.opossum` file from the
 * `recentlyOpenedPaths` user setting, or undefined if there is none, the path
 * does not end in `.opossum`, or the file no longer exists.
 */
export async function getLastOpenedFilePath(): Promise<string | undefined> {
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
