// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';

import { Checkbox } from '../../Checkbox/Checkbox';
import { ListCard } from '../ListCard';

describe('The ListCard', () => {
  it('renders text without count', () => {
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByText('card text')).toBeInTheDocument();
    expect(screen.getByText('card text of second line')).toBeInTheDocument();
  });

  it('renders text with count', () => {
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        count={13}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByText('card text')).toBeInTheDocument();
    expect(screen.getByText('card text of second line')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('renders leftElement if provided as input', () => {
    const leftElement = <Checkbox checked={false} onChange={jest.fn()} />;
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        onClick={jest.fn()}
        leftElement={leftElement}
      />,
    );

    expect(screen.getByText('card text')).toBeInTheDocument();
    expect(screen.getByText('card text of second line')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
