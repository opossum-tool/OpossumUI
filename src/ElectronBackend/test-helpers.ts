// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';

export function createTempFolder(): string {
  return fs.mkdtempSync(`temp-folder-${Date.now()}`);
}

export function deleteFolder(folderName: string): void {
  fs.rmdirSync(folderName, { recursive: true });
}
