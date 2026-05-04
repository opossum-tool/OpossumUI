// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const pendingMacOsOpenFilePaths: Array<string> = [];

let runtimeMacOsOpenFileHandler: ((filePath: string) => void) | null = null;

export function queueMacOsOpenFile(filePath: string): void {
  if (runtimeMacOsOpenFileHandler) {
    runtimeMacOsOpenFileHandler(filePath);
    return;
  }

  pendingMacOsOpenFilePaths.push(filePath);
}

export function consumeStartupMacOsOpenFilePath(): string | null {
  return pendingMacOsOpenFilePaths.shift() ?? null;
}

export function clearPendingMacOsOpenFilePaths(): void {
  pendingMacOsOpenFilePaths.length = 0;
}

export function setRuntimeMacOsOpenFileHandler(
  handler: (filePath: string) => void,
): void {
  runtimeMacOsOpenFileHandler = handler;

  for (const filePath of pendingMacOsOpenFilePaths.splice(0)) {
    runtimeMacOsOpenFileHandler(filePath);
  }
}

export function resetMacOsOpenFileHandlingForTests(): void {
  clearPendingMacOsOpenFilePaths();
  runtimeMacOsOpenFileHandler = null;
}
