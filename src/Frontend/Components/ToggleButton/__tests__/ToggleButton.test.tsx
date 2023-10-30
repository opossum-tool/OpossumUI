// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react';

import { doNothing } from '../../../util/do-nothing';
import { ToggleButton } from '../ToggleButton';

describe('ToggleButton', () => {
  it('renders a button', () => {
    render(
      <ToggleButton
        buttonText={'Test'}
        selected={false}
        handleChange={doNothing}
        disabled={false}
      />,
    );

    fireEvent.click(screen.queryByText('Test') as Element);
  });
});
