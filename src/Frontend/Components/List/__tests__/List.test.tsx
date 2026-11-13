// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { expectTextVisible } from '../../../../testing/ui';
import { renderComponent } from '../../../test-helpers/render';
import { List } from '../List';

describe('List', () => {
  it('renders list items', async () => {
    const data = faker.helpers.multiple(() => ({ id: faker.string.uuid() }));
    await renderComponent(
      <List data={data} renderItemContent={(item) => <div>{item.id}</div>} />,
    );

    data.forEach((item) => {
      expect(screen.getByText(item.id)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    await expectTextVisible(text.generic.noResults, false);
  });

  it('renders loading state', async () => {
    const data = faker.helpers.multiple(() => ({ id: faker.string.uuid() }));
    await renderComponent(
      <List
        loading
        data={data}
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await expectTextVisible(text.generic.noResults, false);
  });

  it('renders empty placeholder when no results', async () => {
    await renderComponent(
      <List
        data={[] as Array<{ id: string }>}
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    await expectTextVisible(text.generic.noResults, true);
  });

  it('reserves unloaded rows and requests the next page when they enter the range', async () => {
    const fetchNextPage = vi.fn();
    const itemHeight = 40;
    await renderComponent(
      <VirtuosoMockContext
        value={{
          itemHeight,
          viewportHeight: itemHeight * 3,
        }}
      >
        <List
          data={[{ id: 'loaded' }]}
          totalCount={4}
          unloadedItemHeight={itemHeight}
          endReached={fetchNextPage}
          renderItemContent={(item) => <div>{item.id}</div>}
        />
      </VirtuosoMockContext>,
    );

    expect(fetchNextPage).toHaveBeenCalled();
  });
});
