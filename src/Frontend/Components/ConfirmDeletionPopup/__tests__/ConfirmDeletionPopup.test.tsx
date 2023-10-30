// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ConfirmDeletionPopup } from '../ConfirmDeletionPopup';

describe('The ConfirmDeletionPopup', () => {
  it('renders', () => {
    const expectedContent =
      'Do you really want to delete this attribution for the current file?';
    const expectedHeader = 'Confirm Deletion';

    renderComponentWithStore(<ConfirmDeletionPopup />);

    expect(screen.getByText(expectedContent)).toBeInTheDocument();
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
  });
});
