// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import path from 'path';
import upath from 'upath';

function getNoticesDirectory(): string {
  if (!app.isPackaged) {
    return path.join(upath.toUnix(__dirname), '..', '..', 'notices');
  }

  return path.join(process.resourcesPath, 'notices');
}

export function getPathOfNoticeDocument(): string {
  return path.join(getNoticesDirectory(), 'notices.html');
}

export function getPathOfChromiumNoticeDocument(): string {
  return path.join(getNoticesDirectory(), 'LICENSES.chromium.html');
}
