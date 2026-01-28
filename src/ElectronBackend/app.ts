// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';

import { main } from './main/main';

// allow opening a file when double-clicking it in mac-os. Has to be called before the ready event is emitted
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (filePath.endsWith('.opossum')) {
    for (const arg of process.argv) {
      if (arg.endsWith('.opossum')) {
        return;
      }
    }
    process.argv.push(filePath);
  }
});

app.on('ready', main);

app.on('window-all-closed', () => {
  app.quit();
});
