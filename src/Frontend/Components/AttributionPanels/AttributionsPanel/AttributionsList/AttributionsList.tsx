// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import { useMemo } from 'react';

import type {
  Attributions,
  PackageInfo,
} from '../../../../../shared/shared-types';
import { TRANSITION } from '../../../../shared-styles';
import { isPackageIncomplete } from '../../../../util/input-validation';
import {
  INFINITE_LIST_BOTTOM_OVERSCAN,
  List,
  type ListItemContentProps,
} from '../../../List/List';
import {
  getPackageCardListItemHeight,
  PackageCard,
  type PackageCardDensity,
} from '../../../PackageCard/PackageCard';
import { SearchList } from '../../../SearchList/SearchList';

interface Props {
  density?: PackageCardDensity;
  showCount?: boolean;
  activeAttributionIds: Array<string> | null;
  attributions: Attributions | null;
  contentHeight: string;
  loading: boolean;
  loadingMore: boolean;
  loadMoreError: unknown;
  fetchNextPage: (requiredEndIndex?: number) => Promise<void>;
  selectedAttributionId: string;
  selectionRevealKey?: string;
  totalAttributionCount?: number;
  resultSetKey: string;
  onSelect: (attribution: PackageInfo) => void;
  isPickerSource?: (attributionId: string) => boolean;
  checkbox?: {
    isChecked: (attributionId: string) => boolean;
    onToggle: (attributionId: string, checked: boolean) => void;
    disabled: boolean;
  };
}

export const AttributionsList: React.FC<Props> = ({
  density = 'compact',
  showCount,
  attributions,
  activeAttributionIds,
  selectedAttributionId,
  contentHeight,
  loading,
  loadingMore,
  loadMoreError,
  fetchNextPage,
  totalAttributionCount,
  resultSetKey,
  selectionRevealKey,
  onSelect,
  isPickerSource,
  checkbox,
}) => {
  const initialSelectedAttributionIndex = useMemo(
    () => activeAttributionIds?.findIndex((id) => id === selectedAttributionId),
    [activeAttributionIds, selectedAttributionId],
  );

  return (
    <List
      renderItemContent={renderAttributionCard}
      data={activeAttributionIds?.map((id) => ({ id })) ?? null}
      totalCount={totalAttributionCount}
      unloadedItemHeight={getPackageCardListItemHeight(density)}
      resultSetKey={resultSetKey}
      components={{ List: SearchList }}
      selectedId={selectedAttributionId}
      selectionRevealKey={selectionRevealKey}
      // VirtuosoMockContext cannot scroll back to a centered top item: passing
      // {index: 0, align: 'center'} virtualizes away the first row in tests.
      initialTopMostItemIndex={
        initialSelectedAttributionIndex !== undefined &&
        initialSelectedAttributionIndex > 0
          ? { index: initialSelectedAttributionIndex, align: 'center' }
          : undefined
      }
      loading={loading}
      loadingMore={loadingMore}
      loadMoreError={loadMoreError}
      onRetryLoadMore={(requiredEndIndex) =>
        void fetchNextPage(requiredEndIndex)
      }
      endReached={(requiredEndIndex) => void fetchNextPage(requiredEndIndex)}
      increaseViewportBy={{ bottom: INFINITE_LIST_BOTTOM_OVERSCAN, top: 0 }}
      sx={{ transition: TRANSITION, height: contentHeight }}
    />
  );

  function renderAttributionCard(
    { id: attributionId }: { id: string },
    { selected, focused }: ListItemContentProps,
  ) {
    const attribution = attributions?.[attributionId];

    if (!attribution) {
      return null;
    }

    return (
      <>
        <PackageCard
          density={density}
          showCount={showCount}
          onClick={() => {
            selectedAttributionId !== attributionId && onSelect(attribution);
          }}
          cardConfig={{
            selected,
            focused,
            pickerSource: isPickerSource?.(attributionId) ?? false,
            incomplete: isPackageIncomplete(attribution),
          }}
          packageInfo={attribution}
          checkbox={
            checkbox
              ? {
                  checked: checkbox.isChecked(attributionId),
                  disabled:
                    checkbox.disabled ||
                    attribution.resourceAccess === 'readonly',
                  onChange: (event) => {
                    checkbox.onToggle(attributionId, event.target.checked);
                    !selectedAttributionId && onSelect(attribution);
                  },
                }
              : undefined
          }
        />
        <MuiDivider />
      </>
    );
  }
};
