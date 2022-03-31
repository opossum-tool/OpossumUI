// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function getNewFolderProgressBarWorker(): Worker {
  return new Worker(new URL('./folder-progress-bar-worker', import.meta.url));
}
