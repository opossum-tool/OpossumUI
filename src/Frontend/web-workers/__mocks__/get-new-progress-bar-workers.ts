// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function getNewProgressBarWorkers(): Worker {
  return {
    postMessage: () => {
      throw new Error('JEST-MOCK-GET-NEW-PROGRESS-BAR-WORKER');
    },
  } as unknown as Worker;
}
