// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { ListCard } from '../ListCard';
import { Checkbox } from '../../Checkbox/Checkbox';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';

describe('The ListCard', () => {
  test('renders text with no count', () => {
    renderComponentWithStore(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        onClick={doNothing}
        cardConfig={{}}
      />
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
  });

  test('renders text with small count', () => {
    renderComponentWithStore(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        count={13}
        onClick={doNothing}
        cardConfig={{}}
      />
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByText('13'));
  });

  test('renders text with medium count', () => {
    renderComponentWithStore(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        count={13000}
        onClick={doNothing}
        cardConfig={{}}
      />
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByText('13k'));
  });

  test('renders text with large count', () => {
    renderComponentWithStore(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        count={1300000}
        onClick={doNothing}
        cardConfig={{}}
      />
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByText('1M'));
  });

  test('renders leftElement if provided as input', () => {
    const leftElement = <Checkbox checked={false} onChange={jest.fn()} />;
    renderComponentWithStore(
      <ListCard
        text={'card text'}
        secondLineText={'card text of second line'}
        onClick={doNothing}
        cardConfig={{}}
        leftElement={leftElement}
      />
    );

    expect(screen.getByText('card text'));
    expect(screen.getByText('card text of second line'));
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
