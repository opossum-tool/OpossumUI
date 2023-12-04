// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../shared/Faker';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { SearchTextField } from '../SearchTextField';

describe('The SearchTextField', () => {
  it('clears and updates the search term', async () => {
    // given
    const onInputChange = jest.fn();
    const initialSearchTerm = faker.string.sample();
    const newSearchTerm = faker.string.sample();
    renderComponentWithStore(
      <SearchTextField
        onInputChange={onInputChange}
        search={initialSearchTerm}
      />,
    );

    // when
    await userEvent.click(screen.getByLabelText('clear search'));
    await userEvent.click(screen.getByRole('searchbox'));
    await userEvent.paste(newSearchTerm);

    // then
    expect(onInputChange).toHaveBeenCalledTimes(2);
    expect(onInputChange).toHaveBeenNthCalledWith(1, '');
    expect(onInputChange).toHaveBeenNthCalledWith(
      2,
      `${initialSearchTerm}${newSearchTerm}`,
    );
  });

  it('hides clear button when no search term entered', () => {
    renderComponentWithStore(
      <SearchTextField onInputChange={jest.fn()} search={''} />,
    );
    expect(screen.queryByLabelText('clear search')).not.toBeInTheDocument();
  });
});
