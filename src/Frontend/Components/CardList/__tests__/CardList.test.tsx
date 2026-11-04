// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import { PACKAGE_CARD_LIST_ITEM_HEIGHT } from '../../PackageCard/PackageCard';
import { CardList } from '../CardList';

function renderCardList({
  itemCount = 2,
  totalCount,
}: {
  itemCount?: number;
  totalCount?: number;
}) {
  return render(
    <VirtuosoMockContext
      value={{ itemHeight: PACKAGE_CARD_LIST_ITEM_HEIGHT, viewportHeight: 400 }}
    >
      <CardList
        testId={'card-list'}
        totalCount={totalCount}
        unloadedItemHeight={PACKAGE_CARD_LIST_ITEM_HEIGHT}
        data={Array.from({ length: itemCount }, (_, index) => ({
          id: `id-${index}`,
        }))}
        renderItemContent={(item) => <div>{item.id}</div>}
      />
    </VirtuosoMockContext>,
  );
}

describe('CardList', () => {
  it('sizes short lists to their content', () => {
    renderCardList({ itemCount: 2 });

    const listElement = screen.getByTestId('card-list');
    const expectedHeight = 2 * PACKAGE_CARD_LIST_ITEM_HEIGHT + 1;
    expect(listElement).toHaveStyle({ height: `${expectedHeight}px` });
    expect(listElement).toHaveStyle({ flex: '0 1 auto' });
  });

  it('includes unloaded items in the preferred height', () => {
    renderCardList({
      itemCount: 5,
      totalCount: 1000,
    });

    const listElement = screen.getByTestId('card-list');
    expect(listElement).toHaveStyle({
      height: `${1000 * PACKAGE_CARD_LIST_ITEM_HEIGHT + 1}px`,
      flex: '0 1 auto',
    });
  });
});
