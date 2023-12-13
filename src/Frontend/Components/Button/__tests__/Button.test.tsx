// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react';
import { noop } from 'lodash';

import { Button } from '../Button';

describe('Button', () => {
  it('renders a button', () => {
    render(<Button buttonText={'Test'} disabled={false} onClick={noop} />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders a tooltip for enabled button', async () => {
    const testTooltipText = 'This button can be clicked';
    render(
      <Button
        buttonText={'Test'}
        disabled={false}
        onClick={noop}
        tooltipText={testTooltipText}
        tooltipPlacement={'left'}
      />,
    );

    fireEvent.mouseOver(screen.getByRole('button'));

    expect(await screen.findByText(testTooltipText)).toBeInTheDocument();
  });

  it('renders a tooltip for disabled button', async () => {
    const testTooltipText = 'This button cannot be clicked';
    render(
      <Button
        buttonText={'Test'}
        disabled={true}
        onClick={noop}
        tooltipText={testTooltipText}
        tooltipPlacement={'left'}
      />,
    );
    fireEvent.mouseOver(screen.getByRole('button'));

    expect(await screen.findByText(testTooltipText)).toBeInTheDocument();
  });
});
