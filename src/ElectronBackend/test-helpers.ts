// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { v4 as uuid4 } from 'uuid';

export function createTempFolder(): string {
  return fs.mkdtempSync(`temp-folder-${uuid4()}`);
}

export function deleteFolder(folderPath: string): void {
  fs.rm(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
  });
}
