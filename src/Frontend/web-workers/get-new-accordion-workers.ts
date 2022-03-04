// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface ResourceDetailsTabsWorkers {
  containedExternalAttributionsAccordionWorker: Worker;
  containedManualAttributionsAccordionWorker: Worker;
}

export function getNewAccordionWorkers(): ResourceDetailsTabsWorkers {
  return {
    containedExternalAttributionsAccordionWorker:
      getNewContainedExternalAttributionsAccordionWorker(),
    containedManualAttributionsAccordionWorker:
      getNewContainedManualAttributionsAccordionWorker(),
  };
}

function getNewContainedExternalAttributionsAccordionWorker(): Worker {
  return new Worker(
    new URL(
      './contained-external-attributions-accordion-worker',
      import.meta.url
    )
  );
}

function getNewContainedManualAttributionsAccordionWorker(): Worker {
  return new Worker(
    new URL('./contained-manual-attributions-accordion-worker', import.meta.url)
  );
}
