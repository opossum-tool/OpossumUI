// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function getNewContainedExternalAttributionsAccordionWorker(): Worker {
  return {
    postMessage: () => {
      throw new Error(
        'JEST-MOCK-GET-NEW-CONTAINED-EXTERNAL-ATTRIBUTIONS-ACCORDION-WORKER'
      );
    },
  } as unknown as Worker;
}

export function getNewContainedManualAttributionsAccordionWorker(): Worker {
  return {
    postMessage: () => {
      throw new Error(
        'JEST-MOCK-GET-NEW-CONTAINED-MANUAL-ATTRIBUTIONS-ACCORDION-WORKER'
      );
    },
  } as unknown as Worker;
}
