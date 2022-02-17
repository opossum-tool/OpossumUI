// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import isDev from 'electron-is-dev';

function getNoticesDirectory(): string {
  if (isDev) {
    return path.join(__dirname, '..', '..', '..', 'notices');
  }

  return path.join(process.resourcesPath, 'notices');
}

export function getPathOfNoticeDocument(): string {
  return path.join(getNoticesDirectory(), 'notices.html');
}

export function getPathOfChromiumNoticeDocument(): string {
  return path.join(getNoticesDirectory(), 'LICENSES.chromium.html');
}
