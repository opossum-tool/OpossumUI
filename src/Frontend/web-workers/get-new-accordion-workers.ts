// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ContainedExternalAttributionsAccordionWorker from './contained-external-attributions-accordion-worker?worker';
import ContainedManualAttributionsAccordionWorker from './contained-manual-attributions-accordion-worker?worker';

export interface ResourceDetailsTabsWorkers {
  containedExternalAttributionsAccordionWorker: Worker;
  containedManualAttributionsAccordionWorker: Worker;
}

export function getNewAccordionWorkers(): ResourceDetailsTabsWorkers {
  return {
    containedExternalAttributionsAccordionWorker:
      new ContainedExternalAttributionsAccordionWorker(),
    containedManualAttributionsAccordionWorker:
      new ContainedManualAttributionsAccordionWorker(),
  };
}
