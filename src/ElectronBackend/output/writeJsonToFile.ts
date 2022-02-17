// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import writeFileAtomic from 'write-file-atomic';

export function writeJsonToFile(filePath: string, content: unknown): void {
  try {
    writeFileAtomic.sync(filePath, JSON.stringify(content));
  } catch (error) {
    throw new Error(`Error while writing the file ${filePath}. \n${error}`);
  }
}
