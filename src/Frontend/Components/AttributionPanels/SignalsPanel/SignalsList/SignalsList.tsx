// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import { groupBy as _groupBy, orderBy as _orderBy } from 'lodash-es';
import { useMemo } from 'react';

import { text } from '../../../../../shared/text';
import { TRANSITION } from '../../../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../../../state/hooks';
import { backend } from '../../../../util/backendClient';
import {
  GroupedList,
  type GroupedListItemContentProps,
} from '../../../GroupedList/GroupedList';
import { SourceIcon } from '../../../Icons/Icons';
import { INFINITE_LIST_BOTTOM_OVERSCAN } from '../../../List/List';
import { PackageCard } from '../../../PackageCard/PackageCard';
import { SearchList } from '../../../SearchList/SearchList';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';
import { GroupName } from './SignalsList.style';

export const SignalsList: React.FC<PackagesPanelChildrenProps> = ({
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
  const canSelectSignals = pickerMode.mode !== 'replace';
  const { data: resolvedExternalAttributionIds } =
    backend.resolvedAttributionUuids.useQuery();
  const { data: sources } = backend.getExternalAttributionSources.useQuery();

  const groupedIds = useMemo(
    () =>
      attributions &&
      activeAttributionIds &&
      _groupBy(
        _orderBy(
          activeAttributionIds,
          (id) => {
            const attribution = attributions[id];
            return (
              attribution &&
              (attribution.source && sources?.[attribution.source.name])
                ?.priority
            );
          },
          'desc',
        ),
        (id) => {
          const attribution = attributions[id];
          return (
            attribution?.source &&
            (sources?.[attribution.source.name]?.name ||
              attribution.source.name)
          );
        },
      ),
    [activeAttributionIds, attributions, sources],
  );

  return (
    <GroupedList
      grouped={groupedIds}
      selectedId={selectedAttributionId}
      renderItemContent={renderAttributionCard}
      components={{ List: SearchList }}
      renderGroupName={(sourceName) => (
        <>
          <SourceIcon noTooltip />
          <GroupName>{sourceName}</GroupName>
        </>
      )}
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
    attributionId: string,
    { focused, selected }: GroupedListItemContentProps,
  ) {
    const attribution = attributions?.[attributionId];

    if (!attribution) {
      return null;
    }

    const isPickerSource =
      pickerMode.mode === 'compare' &&
      pickerMode.compareSelectionSource.id === attributionId;

    return (
      <>
        <PackageCard
          onClick={
            canSelectSignals
              ? () => {
                  selectedAttributionId !== attributionId &&
                    dispatch(
                      changeSelectedAttributionOrOpenUnsavedPopup(attribution),
                    );
                }
              : undefined
          }
          cardConfig={{
            selected,
            focused,
            pickerSource: isPickerSource,
            resolved: resolvedExternalAttributionIds?.has(attributionId),
          }}
          packageInfo={attribution}
          readonlyIconLabel={text.packageLists.readonlySignalLabel}
          readonlyTooltip={text.packageLists.readonlySignalCannotBeSelected}
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
