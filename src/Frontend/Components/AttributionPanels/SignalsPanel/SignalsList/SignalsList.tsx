// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import { groupBy as _groupBy, orderBy as _orderBy, without } from 'lodash';
import { useMemo } from 'react';

import { TRANSITION } from '../../../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
  getExternalAttributionSources,
  getResolvedExternalAttributions,
} from '../../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { GroupedList } from '../../../GroupedList/GroupedList';
import { SourceIcon } from '../../../Icons/Icons';
import { PackageCard } from '../../../PackageCard/PackageCard';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';
import { GroupName } from './SignalsList.style';

export const SignalsList: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  activeAttributionIds,
  selectedAttributionId,
  contentHeight,
  loading,
  setMultiSelectedAttributionIds,
  multiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const resolvedExternalAttributionIds = useAppSelector(
    getResolvedExternalAttributions,
  );
  const sources = useAppSelector(getExternalAttributionSources);

  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
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
              (attribution.source && sources[attribution.source.name])?.priority
            );
          },
          'desc',
        ),
        (id) => {
          const attribution = attributions[id];
          return (
            attribution?.source &&
            (sources[attribution.source.name]?.name || attribution.source.name)
          );
        },
      ),
    [activeAttributionIds, attributions, sources],
  );

  return (
    <GroupedList
      grouped={groupedIds}
      selected={selectedAttributionId}
      renderItemContent={renderAttributionCard}
      renderGroupName={(sourceName) => (
        <>
          <SourceIcon noTooltip />
          <GroupName>{sourceName}</GroupName>
        </>
      )}
      loading={loading}
      sx={{ transition: TRANSITION, height: contentHeight }}
    />
  );

  function renderAttributionCard(attributionId: string) {
    const attribution = attributions?.[attributionId];

    if (!attribution) {
      return null;
    }

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
            selected: attributionId === selectedAttributionId,
            resolved: resolvedExternalAttributionIds.has(attributionId),
          }}
          packageInfo={attribution}
          checkbox={{
            checked: multiSelectedAttributionIds.includes(attributionId),
            disabled: !!attributionIdsForReplacement.length,
            onChange: (event) => {
              setMultiSelectedAttributionIds(
                event.target.checked
                  ? [...multiSelectedAttributionIds, attributionId]
                  : without(multiSelectedAttributionIds, attributionId),
              );
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
