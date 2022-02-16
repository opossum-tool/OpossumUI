// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import { ConfirmDeletionGloballyPopup } from '../ConfirmDeletionGloballyPopup';

describe('The ConfirmDeletionGloballyPopup', () => {
  test('renders', () => {
    const expectedContent =
      'Do you really want to delete this attribution for all files?';
    const expectedHeader = 'Confirm Deletion';

    renderComponentWithStore(<ConfirmDeletionGloballyPopup />);

    expect(screen.getByText(expectedContent)).toBeInTheDocument();
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
  });
});
