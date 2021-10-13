// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { ListCard } from '../ListCard';

describe('The ListCard', () => {
  test('renders text with no count', () => {
    render(
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
    render(
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
    render(
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
    render(
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
});
