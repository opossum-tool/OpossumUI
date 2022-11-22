// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface ProgressBarWorkers {
  TopProgressBarWorker: Worker;
  FolderProgressBarWorker: Worker;
}

export function getNewProgressBarWorkers(): ProgressBarWorkers {
  return {
    TopProgressBarWorker: getNewProgressBarWorker(),
    FolderProgressBarWorker: getNewProgressBarWorker(),
  };
}

function getNewProgressBarWorker(): Worker {
  return new Worker(new URL('./progress-bar-worker', import.meta.url));
}
