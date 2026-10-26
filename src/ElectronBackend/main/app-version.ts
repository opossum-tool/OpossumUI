// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';

import commitInfo from '../../commitInfo.json';
import {
  formatReleaseTag,
  parseInstalledVersion,
} from '../../shared/update-version';

export function getAppVersion(): string {
  if (!app.isPackaged) {
    return commitInfo.commitInfo;
  }

  const installedVersion = app.getVersion();
  const version = parseInstalledVersion(installedVersion);
  if (!version) {
    return `${installedVersion} (${commitInfo.commitInfo})`;
  }

  return formatReleaseTag(version);
}
