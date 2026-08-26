// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';

import type { PackageInfo } from '../../../shared/shared-types';
import { CardList } from '../CardList/CardList';
import { PackageCard } from '../PackageCard/PackageCard';

export function AttributionCardList({
  attributions,
  testId,
  loadingMore,
  loadMoreError,
  onRetryLoadMore,
  endReached,
  fillAvailableHeight,
}: {
  attributions: Array<PackageInfo>;
  testId?: string;
  loadingMore?: boolean;
  loadMoreError?: unknown;
  onRetryLoadMore?: () => void;
  endReached?: () => void;
  fillAvailableHeight?: boolean;
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
      renderItemContent={(attribution, { index }) => (
        <>
          <PackageCard packageInfo={attribution} />
          {index + 1 !== attributions.length && <MuiDivider />}
        </>
      )}
    />
  );
}
