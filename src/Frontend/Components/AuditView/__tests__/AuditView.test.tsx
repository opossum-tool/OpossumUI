// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AuditView } from '../AuditView';
import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';

jest.mock('../../ResourceDetailsTabs/get-new-accordion-worker');

describe('The AuditView', () => {
  test('renders AuditView', () => {
    renderComponentWithStore(<AuditView />);
  });
});
