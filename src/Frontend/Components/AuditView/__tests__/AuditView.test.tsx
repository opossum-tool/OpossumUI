// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AuditView } from '../AuditView';
import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  getNewContainedExternalAttributionsAccordionWorker,
  getNewContainedManualAttributionsAccordionWorker,
  ResourceDetailsTabsWorkers,
} from '../../../web-workers/get-new-accordion-worker';

describe('The AuditView', () => {
  test('renders AuditView', () => {
    const mockResourceDetailsTabsWorkers: ResourceDetailsTabsWorkers = {
      containedExternalAttributionsAccordionWorker:
        getNewContainedExternalAttributionsAccordionWorker(),
      containedManualAttributionsAccordionWorker:
        getNewContainedManualAttributionsAccordionWorker(),
    };

    renderComponentWithStore(
      <AuditView resourceDetailsTabsWorkers={mockResourceDetailsTabsWorkers} />
    );
  });
});
