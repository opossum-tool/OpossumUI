// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import { GroupedList } from '../GroupedList';

describe('GroupedList', () => {
  it('renders list items', () => {
    const data = faker.helpers.multiple(faker.string.uuid);
    renderComponent(
      <GroupedList
        grouped={{ key: data }}
        renderItemContent={(id) => <div>{id}</div>}
      />,
    );

    data.forEach((id) => {
      expect(screen.getByText(id)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByText(text.generic.noResults)).not.toBeInTheDocument();
  });

  it('renders loading state', () => {
    const data = faker.helpers.multiple(faker.string.uuid);
    renderComponent(
      <GroupedList
        loading
        grouped={{ key: data }}
        renderItemContent={(id) => <div>{id}</div>}
      />,
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByText(text.generic.noResults)).not.toBeInTheDocument();
  });

  it('renders empty placeholder when no results', () => {
    renderComponent(
      <GroupedList grouped={{}} renderItemContent={(id) => <div>{id}</div>} />,
    );

    expect(screen.getByText(text.generic.noResults)).toBeInTheDocument();
  });
});
