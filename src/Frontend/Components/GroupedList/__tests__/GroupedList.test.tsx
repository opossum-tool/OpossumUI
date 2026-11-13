// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { expectTextVisible } from '../../../../testing/ui';
import { renderComponent } from '../../../test-helpers/render';
import { GroupedList } from '../GroupedList';

describe('GroupedList', () => {
  it('renders headers for supplied groups', async () => {
    await renderComponent(
      <GroupedList
        grouped={{ source: ['item'] }}
        renderGroupName={(key) => <div>{key}</div>}
        renderItemContent={(id) => <div>{id}</div>}
      />,
    );

    await expectTextVisible('source', true);
  });

  it('does not render a header for a synthesized unloaded group', async () => {
    await renderComponent(
      <GroupedList
        grouped={{}}
        totalCount={1}
        unloadedItemHeight={1}
        renderGroupName={(key) => <div data-testid={'group-header'}>{key}</div>}
        renderItemContent={(id) => <div>{id}</div>}
      />,
    );

    expect(screen.queryByTestId('group-header')).not.toBeInTheDocument();
  });

  it('renders list items', async () => {
    const data = faker.helpers.multiple(faker.string.uuid);
    await renderComponent(
      <GroupedList
        grouped={{ key: data }}
        renderItemContent={(id) => <div>{id}</div>}
      />,
    );

    data.forEach((id) => {
      expect(screen.getByText(id)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    await expectTextVisible(text.generic.noResults, false);
  });

  it('renders loading state', async () => {
    const data = faker.helpers.multiple(faker.string.uuid);
    await renderComponent(
      <GroupedList
        loading
        grouped={{ key: data }}
        renderItemContent={(id) => <div>{id}</div>}
      />,
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await expectTextVisible(text.generic.noResults, false);
  });

  it('renders empty placeholder when no results', async () => {
    await renderComponent(
      <GroupedList grouped={{}} renderItemContent={(id) => <div>{id}</div>} />,
    );

    await expectTextVisible(text.generic.noResults, true);
  });
});
