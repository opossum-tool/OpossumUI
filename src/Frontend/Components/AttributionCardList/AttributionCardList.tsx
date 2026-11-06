// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import type { SxProps } from '@mui/system';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { maybePluralize } from '../../util/maybe-pluralize';
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
  totalCount,
  resultSetKey,
  sx,
}: {
  attributions: Array<PackageInfo>;
  testId?: string;
  loadingMore?: boolean;
  loadMoreError?: unknown;
  onRetryLoadMore?: (requiredEndIndex?: number) => void;
  endReached?: (index: number) => void;
  totalCount?: number;
  resultSetKey?: string;
  sx?: SxProps;
}) {
  return (
    <CardList
      data={attributions}
      data-testid={testId}
      loadingMore={loadingMore}
      loadMoreError={loadMoreError}
      onRetryLoadMore={onRetryLoadMore}
      endReached={endReached}
      totalCount={totalCount}
      unloadedItemHeight={PACKAGE_CARD_LIST_ITEM_HEIGHT}
      resultSetKey={resultSetKey}
      sx={sx}
      renderItemContent={(attribution, { index }) => (
        <>
          <PackageCard
            packageInfo={{
              ...attribution,
              count: attribution.writableLinkedResourceCount,
            }}
            countTooltip={maybePluralize(
              attribution.writableLinkedResourceCount ?? 0,
              text.confirmAttributionActionPopup.editableLinkedResource,
              { showOne: true },
            )}
          />
          {index + 1 !== attributions.length && <MuiDivider />}
        </>
      )}
    />
  );
}
