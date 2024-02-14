// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import { noop } from 'lodash';

import { IconButton } from '../IconButton';

describe('IconButton', () => {
  it('renders a button', () => {
    render(
      <IconButton
        tooltipTitle={'Test'}
        tooltipPlacement="left"
        disabled={false}
        onClick={noop}
        icon={<div>Test Icon</div>}
      />,
    );

    expect(screen.getByLabelText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test Icon')).toBeInTheDocument();
  });

  it('renders tooltip when hidden flag is inactive', () => {
    render(
      <IconButton
        tooltipTitle={'Test'}
        tooltipPlacement="left"
        disabled={false}
        onClick={noop}
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
        onClick={noop}
        icon={<div>Test Icon</div>}
        hidden={true}
      />,
    );

    expect(screen.queryByTitle('Test')).not.toBeInTheDocument();
  });

  it('hides button', () => {
    const { container } = render(
      <IconButton
        tooltipTitle={'Test'}
        tooltipPlacement="left"
        disabled={false}
        onClick={noop}
        icon={<div>Test Icon</div>}
        hidden={true}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
