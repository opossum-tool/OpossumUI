// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ResourceDetailsTabsWorkers } from '../get-new-accordion-workers';

export function getNewAccordionWorkers(): ResourceDetailsTabsWorkers {
  return {
    containedExternalAttributionsAccordionWorker:
      getNewContainedExternalAttributionsAccordionWorker(),
    containedManualAttributionsAccordionWorker:
      getNewContainedManualAttributionsAccordionWorker(),
  };
}

function getNewContainedExternalAttributionsAccordionWorker(): Worker {
  return {
    postMessage: () => {
      throw new Error(
        'JEST-MOCK-GET-NEW-CONTAINED-EXTERNAL-ATTRIBUTIONS-ACCORDION-WORKER'
      );
    },
  } as unknown as Worker;
}

function getNewContainedManualAttributionsAccordionWorker(): Worker {
  return {
    postMessage: () => {
      throw new Error(
        'JEST-MOCK-GET-NEW-CONTAINED-MANUAL-ATTRIBUTIONS-ACCORDION-WORKER'
      );
    },
  } as unknown as Worker;
}
