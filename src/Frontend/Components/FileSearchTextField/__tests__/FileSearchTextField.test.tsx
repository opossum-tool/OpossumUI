// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { FileSearchTextField } from '../FileSearchTextField';
import { act } from 'react-dom/test-utils';

describe('The FileSearchTextField', () => {
  jest.useFakeTimers('modern');
  const debounceDelayInMs = 200;

  test('renders', () => {
    const setFilteredPaths = jest.fn();
    renderComponentWithStore(
      <FileSearchTextField setFilteredPaths={setFilteredPaths} />
    );
    screen.getAllByText('Search');
  });

  test('calls callback after debounce time', () => {
    const setFilteredPaths = jest.fn();
    renderComponentWithStore(
      <FileSearchTextField setFilteredPaths={setFilteredPaths} />
    );

    screen.getAllByText('Search');

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'test' },
    });

    expect(setFilteredPaths).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(debounceDelayInMs);
    });

    expect(setFilteredPaths).toHaveBeenCalled();
  });
});
