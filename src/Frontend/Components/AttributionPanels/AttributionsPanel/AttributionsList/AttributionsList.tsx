// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';

import { TRANSITION } from '../../../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../../../state/hooks';
import { isPackageIncomplete } from '../../../../util/input-validation';
import {
  INFINITE_LIST_BOTTOM_OVERSCAN,
  List,
  type ListItemContentProps,
} from '../../../List/List';
import { PackageCard } from '../../../PackageCard/PackageCard';
import { SearchList } from '../../../SearchList/SearchList';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const AttributionsList: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  activeAttributionIds,
  selectedAttributionId,
  contentHeight,
  loading,
  loadingMore,
  loadMoreError,
  fetchNextPage,
  pickerMode,
  isAttributionSelected,
  toggleAttributionSelection,
}) => {
  const dispatch = useAppDispatch();

  return (
    <List
      renderItemContent={renderAttributionCard}
      data={
        activeAttributionIds?.map((id) => ({
          id,
        })) ?? null
      }
      components={{ List: SearchList }}
      selectedId={selectedAttributionId}
      loading={loading}
      loadingMore={loadingMore}
      loadMoreError={loadMoreError}
      onRetryLoadMore={() => void fetchNextPage()}
      endReached={() => void fetchNextPage()}
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

    const isPickerSource =
      (pickerMode.mode === 'replace' &&
        pickerMode.selectionForReplacement.mode === 'explicit' &&
        pickerMode.selectionForReplacement.attributionUuids.includes(
          attributionId,
        )) ||
      (pickerMode.mode === 'compare' &&
        pickerMode.compareSelectionSource.id === attributionId);

    return (
      <>
        <PackageCard
          onClick={() => {
            selectedAttributionId !== attributionId &&
              dispatch(
                changeSelectedAttributionOrOpenUnsavedPopup(attribution),
              );
          }}
          cardConfig={{
            selected,
            focused,
            pickerSource: isPickerSource,
            incomplete: isPackageIncomplete(attribution),
          }}
          packageInfo={attribution}
          checkbox={{
            checked: isAttributionSelected(attributionId),
            disabled:
              pickerMode.isActive || attribution.resourceAccess === 'readonly',
            onChange: (event) => {
              toggleAttributionSelection(attributionId, event.target.checked);
              !selectedAttributionId &&
                dispatch(
                  changeSelectedAttributionOrOpenUnsavedPopup(attribution),
                );
            },
          }}
        />
        <MuiDivider />
      </>
    );
  }
};
