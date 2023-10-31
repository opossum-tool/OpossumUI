// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { AuditView } from '../AuditView';

describe('The AuditView', () => {
  it('renders AuditView', () => {
    renderComponentWithStore(<AuditView />);
  });
});
