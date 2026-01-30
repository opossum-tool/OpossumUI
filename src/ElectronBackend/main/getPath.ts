// SPDX-FileCopyrightText: Tarun Samanta <tarunsamanta77@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import path from 'path';
import upath from 'upath';

export function getBasePathOfAssets(): string {
  return app.isPackaged
    ? path.join(upath.toUnix(__dirname), '..', 'assets')
    : path.join(upath.toUnix(__dirname), '..', '..', 'public', 'assets');
}
