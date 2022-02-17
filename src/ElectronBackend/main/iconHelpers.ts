// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import isDev from 'electron-is-dev';
import path from 'path';
import upath from 'upath';

export function getIconPath(): string {
  const basePath = isDev
    ? path.join(upath.toUnix(__dirname), '../../../public')
    : path.join(upath.toUnix(__dirname), '../..');
  return path.join(basePath, 'icons/icon_512x512.png');
}
