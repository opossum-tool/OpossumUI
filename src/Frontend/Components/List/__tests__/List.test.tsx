// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
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
    expect(screen.queryByText(text.generic.noResults)).not.toBeInTheDocument();
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
    expect(screen.queryByText(text.generic.noResults)).not.toBeInTheDocument();
  });

  it('renders empty placeholder when no results', async () => {
    await renderComponent(
      <List
        data={[] as Array<{ id: string }>}
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    expect(screen.getByText(text.generic.noResults)).toBeInTheDocument();
  });
  it('does not use selectedId to initialize or reinitialize the viewport', async () => {
    const itemHeight = 40;
    const data = Array.from({ length: 10 }, (_, index) => ({
      id: `item-${index}`,
    }));
    const renderList = (selectedId?: string) => (
      <VirtuosoMockContext
        value={{
          itemHeight,
          viewportHeight: itemHeight * 2,
        }}
      >
        <List
          data={data}
          selectedId={selectedId}
          renderItemContent={(item) => <div>{item.id}</div>}
        />
      </VirtuosoMockContext>
    );

    const { rerender } = await renderComponent(renderList(data[9].id));

    expect(screen.getByText(data[0].id)).toBeInTheDocument();
    expect(screen.queryByText(data[9].id)).not.toBeInTheDocument();

    rerender(renderList(data[1].id));

    expect(screen.getByText(data[0].id)).toBeInTheDocument();
    expect(screen.getByText(data[1].id)).toBeInTheDocument();
  });
});
