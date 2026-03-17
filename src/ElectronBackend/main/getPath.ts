// SPDX-FileCopyrightText: Tarun Samanta <tarunsamanta77@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import path from 'path';

import { app } from '../electronInterop';

export function getBasePathOfAssets(): string {
  return app.isPackaged
    ? path.join(import.meta.dirname, '..', 'assets')
    : path.join(import.meta.dirname, '..', '..', 'public', 'assets');
}
