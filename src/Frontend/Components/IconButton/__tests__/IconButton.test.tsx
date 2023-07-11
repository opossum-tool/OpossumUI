// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { IconButton } from '../IconButton';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';

describe('IconButton', () => {
  it('renders a button', () => {
    render(
      <IconButton
        tooltipTitle={'Test'}
        tooltipPlacement="left"
        disabled={false}
        onClick={doNothing}
        icon={<div>Test Icon</div>}
      />,
    );

    expect(screen.getByLabelText('Test'));
    expect(screen.getByText('Test Icon'));
  });

  it('renders tooltip when hidden flag is inactive', () => {
    render(
      <IconButton
        tooltipTitle={'Test'}
        tooltipPlacement="left"
        disabled={false}
        onClick={doNothing}
        icon={<div>Test Icon</div>}
        hidden={false}
      />,
    );

    expect(screen.getByTitle('Test')).toBeInTheDocument();
  });

  it('does not render tooltip when hidden flag is active', () => {
    render(
      <IconButton
        tooltipTitle={'Test'}
        tooltipPlacement="left"
        disabled={false}
        onClick={doNothing}
        icon={<div>Test Icon</div>}
        hidden={true}
      />,
    );

    expect(screen.queryByTitle('Test')).not.toBeInTheDocument();
  });

  it('checks for successful application of hidden visibility style', () => {
    render(
      <IconButton
        tooltipTitle={'Test'}
        tooltipPlacement="left"
        disabled={false}
        onClick={doNothing}
        icon={<div>Test Icon</div>}
        hidden={true}
      />,
    );

    expect(screen.getByLabelText('Test')).toHaveStyle('visibility: hidden');
  });
});
