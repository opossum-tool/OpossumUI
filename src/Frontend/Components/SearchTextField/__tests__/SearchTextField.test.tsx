// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { SearchTextField } from '../SearchTextField';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';

describe('The SearchTextField', () => {
  it('has search functionality', () => {
    const onInputchange = jest.fn();
    renderComponentWithStore(
      <SearchTextField
        onInputChange={onInputchange}
        search={'test-search'}
        showIcon={true}
      />
    );
    screen.getAllByText('Search');

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'test' },
    });
    expect(onInputchange).toHaveBeenCalled();
  });
});
