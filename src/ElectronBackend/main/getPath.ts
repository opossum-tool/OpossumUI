// SPDX-FileCopyrightText: Tarun Samanta <tarunsamanta77@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import isDev from 'electron-is-dev';
import path from 'path';
import upath from 'upath';

export function getBasePathOfAssets(): string {
  const basePath = isDev
    ? path.join(upath.toUnix(__dirname), '../../../public/assets')
    : path.join(upath.toUnix(__dirname), '../../assets');
  return basePath;
}
