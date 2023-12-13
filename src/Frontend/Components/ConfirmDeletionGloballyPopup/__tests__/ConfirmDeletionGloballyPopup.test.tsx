// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponent } from '../../../test-helpers/render';
import { ConfirmDeletionGloballyPopup } from '../ConfirmDeletionGloballyPopup';

describe('The ConfirmDeletionGloballyPopup', () => {
  it('renders', () => {
    const expectedContent =
      'Do you really want to delete this attribution for all files?';
    const expectedHeader = 'Confirm Deletion';

    renderComponent(<ConfirmDeletionGloballyPopup />);

    expect(screen.getByText(expectedContent)).toBeInTheDocument();
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
  });
});
