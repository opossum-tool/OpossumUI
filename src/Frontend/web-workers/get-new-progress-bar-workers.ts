// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ProgressBarWorker from './progress-bar-worker?worker';

export interface ProgressBarWorkers {
  TopProgressBarWorker: Worker;
  FolderProgressBarWorker: Worker;
}

export function getNewProgressBarWorkers(): ProgressBarWorkers {
  return {
    TopProgressBarWorker: new ProgressBarWorker(),
    FolderProgressBarWorker: new ProgressBarWorker(),
  };
}
