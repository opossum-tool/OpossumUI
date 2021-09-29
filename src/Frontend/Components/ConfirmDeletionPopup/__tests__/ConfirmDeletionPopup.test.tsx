// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import { ConfirmDeletionPopup } from '../ConfirmDeletionPopup';

describe('The ConfirmDeletionPopup', () => {
  test('renders', () => {
    const expectedContent = 'Do you really want to delete this attribution?';
    const expectedHeader = 'Confirm Deletion';

    renderComponentWithStore(<ConfirmDeletionPopup />);

    expect(screen.queryByText(expectedContent)).toBeTruthy();
    expect(screen.queryByText(expectedHeader)).toBeTruthy();
  });
});
