// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';

import { createMenu } from '../menu';

export class DisabledMenuItemHandler {
  static activateMenuItems(mainWindow: BrowserWindow): () => Promise<void> {
    return async () => createMenu(mainWindow);
  }
}
