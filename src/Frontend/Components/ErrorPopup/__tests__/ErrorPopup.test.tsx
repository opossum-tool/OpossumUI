// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponent } from '../../../test-helpers/render';
import { ErrorPopup } from '../ErrorPopup';

describe('Error popup', () => {
  it('renders', async () => {
    await renderComponent(<ErrorPopup content="Invalid link." />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
