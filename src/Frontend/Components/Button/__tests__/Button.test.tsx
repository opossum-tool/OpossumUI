// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react';

import { doNothing } from '../../../util/do-nothing';
import { Button } from '../Button';

describe('Button', () => {
  it('renders a button', () => {
    render(
      <Button
        buttonText={'Test'}
        disabled={false}
        isDark={false}
        onClick={doNothing}
      />,
    );

    screen.getByText('Test');
  });

  it('renders a tooltip for enabled button', async () => {
    const testTooltipText = 'This button can be clicked';
    render(
      <Button
        buttonText={'Test'}
        disabled={false}
        isDark={false}
        onClick={doNothing}
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
        isDark={false}
        onClick={doNothing}
        tooltipText={testTooltipText}
        tooltipPlacement={'left'}
      />,
    );
    fireEvent.mouseOver(screen.getByRole('button'));

    expect(await screen.findByText(testTooltipText)).toBeInTheDocument();
  });
});
