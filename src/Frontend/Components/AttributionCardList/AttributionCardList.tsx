// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';

import type { PackageInfo } from '../../../shared/shared-types';
import { CardList } from '../CardList/CardList';
import {
  PACKAGE_CARD_LIST_ITEM_HEIGHT,
  PackageCard,
} from '../PackageCard/PackageCard';

export function AttributionCardList({
  attributions,
  testId,
  loadingMore,
  loadMoreError,
  onRetryLoadMore,
  endReached,
  fillAvailableHeight,
  totalCount,
  resultSetKey,
}: {
  attributions: Array<PackageInfo>;
  testId?: string;
  loadingMore?: boolean;
  loadMoreError?: unknown;
  onRetryLoadMore?: (requiredEndIndex?: number) => void;
  endReached?: (index: number) => void;
  fillAvailableHeight?: boolean;
  totalCount?: number;
  resultSetKey?: string;
}) {
  return (
    <CardList
      data={attributions}
      data-testid={testId}
      loadingMore={loadingMore}
      loadMoreError={loadMoreError}
      onRetryLoadMore={onRetryLoadMore}
      endReached={endReached}
      fillAvailableHeight={fillAvailableHeight}
      totalCount={totalCount}
      unloadedItemHeight={PACKAGE_CARD_LIST_ITEM_HEIGHT}
      resultSetKey={resultSetKey}
      renderItemContent={(attribution, { index }) => (
        <>
          <PackageCard packageInfo={attribution} />
          {index + 1 !== attributions.length && <MuiDivider />}
        </>
      )}
    />
  );
}
