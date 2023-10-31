// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';

import { doNothing } from '../../../util/do-nothing';
import { Checkbox } from '../../Checkbox/Checkbox';
import { ListCard } from '../ListCard';

describe('The ListCard', () => {
  it('renders text with no count', () => {
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        onClick={doNothing}
        cardConfig={{}}
      />,
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
  });

  it('renders text with small count', () => {
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        count={13}
        onClick={doNothing}
        cardConfig={{}}
      />,
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByText('13'));
  });

  it('renders text with medium count', () => {
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        count={13000}
        onClick={doNothing}
        cardConfig={{}}
      />,
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByText('13k'));
  });

  it('renders text with large count', () => {
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        count={1300000}
        onClick={doNothing}
        cardConfig={{}}
      />,
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByText('1M'));
  });

  it('renders leftElement if provided as input', () => {
    const leftElement = <Checkbox checked={false} onChange={jest.fn()} />;
    render(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        onClick={doNothing}
        cardConfig={{}}
        leftElement={leftElement}
      />,
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
