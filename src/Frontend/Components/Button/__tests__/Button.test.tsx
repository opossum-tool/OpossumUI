// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Button } from '../Button';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';

describe('Button', () => {
  it('renders a button', () => {
    render(
      <Button
        buttonText={'Test'}
        disabled={false}
        isDark={false}
        onClick={doNothing}
      />
    );

    screen.getByText('Test');
  });

  it('renders a tooltip for enabled button', () => {
    const testTooltipText = 'This button can be clicked';
    render(
      <Button
        buttonText={'Test'}
        disabled={false}
        isDark={false}
        onClick={doNothing}
        tooltipText={testTooltipText}
        tooltipPlacement={'left'}
      />
    );

    fireEvent.mouseOver(screen.getByRole('button'));

    expect(
      waitFor(() => {
        screen.getByLabelText(testTooltipText);
      })
    ).resolves.toBeInTheDocument();
  });

  it('renders a tooltip for disabled button', () => {
    const testTooltipText = 'This button cannot be clicked';
    render(
      <Button
        buttonText={'Test'}
        disabled={true}
        isDark={false}
        onClick={doNothing}
        tooltipText={testTooltipText}
        tooltipPlacement={'left'}
      />
    );
    fireEvent.mouseOver(screen.getByRole('button'));

    expect(
      waitFor(() => {
        screen.getByLabelText(testTooltipText);
      })
    ).resolves.toBeInTheDocument();
  });
});
