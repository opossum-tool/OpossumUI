// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import { PACKAGE_CARD_LIST_ITEM_HEIGHT } from '../../PackageCard/PackageCard';
import { CardList } from '../CardList';

function renderCardList({
  fillAvailableHeight = false,
  itemCount = 2,
  totalCount,
}: {
  fillAvailableHeight?: boolean;
  itemCount?: number;
  totalCount?: number;
}) {
  return render(
    <VirtuosoMockContext
      value={{ itemHeight: PACKAGE_CARD_LIST_ITEM_HEIGHT, viewportHeight: 400 }}
    >
      <CardList
        testId={'card-list'}
        fillAvailableHeight={fillAvailableHeight}
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
  it('keeps a fixed height when fillAvailableHeight content fits the dialog', () => {
    renderCardList({ fillAvailableHeight: true, itemCount: 2 });

    const listElement = screen.getByTestId('card-list');
    const expectedHeight = 2 * PACKAGE_CARD_LIST_ITEM_HEIGHT + 1;
    expect(listElement).toHaveStyle({ height: `${expectedHeight}px` });
    expect(listElement).toHaveStyle({ flex: '' });
  });

  it('fills available height when fillAvailableHeight content exceeds the dialog', () => {
    renderCardList({
      fillAvailableHeight: true,
      itemCount: 5,
      totalCount: 1000,
    });

    const listElement = screen.getByTestId('card-list');
    expect(listElement).toHaveStyle({ height: 'auto' });
    expect(listElement).toHaveStyle({ flex: '1 1 0%' });
  });

  it('keeps a fixed height without fillAvailableHeight', () => {
    renderCardList({ itemCount: 5 });

    const listElement = screen.getByTestId('card-list');
    const expectedHeight = 4 * PACKAGE_CARD_LIST_ITEM_HEIGHT + 1;
    expect(listElement).toHaveStyle({ height: `${expectedHeight}px` });
    expect(listElement).toHaveStyle({ flex: '' });
  });
});
