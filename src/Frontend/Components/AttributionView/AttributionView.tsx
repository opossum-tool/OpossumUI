// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import React, { ReactElement, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Attributions } from '../../../shared/shared-types';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { getManualAttributions } from '../../state/selectors/all-views-resource-selectors';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';
import { useFilters } from '../../util/use-filters';
import { useWindowHeight } from '../../util/use-window-height';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer/AttributionDetailsViewer';
import { AttributionList } from '../AttributionList/AttributionList';
import {
  clickableIcon,
  disabledIcon,
  OpossumColors,
} from '../../shared-styles';
import { topBarHeight } from '../TopBar/TopBar';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { IconButton } from '../IconButton/IconButton';
import { getActiveFilters } from '../../state/selectors/view-selector';
import { AttributionCountsPanel } from '../AttributionCountsPanel/AttributionCountsPanel';
import { DisplayPackageInfos } from '../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';

const classes = {
  root: {
    width: '100%',
    display: 'flex',
    backgroundColor: OpossumColors.white,
  },
  attributionList: {
    width: '30%',
    margin: '5px',
  },
  disabledIcon,
  clickableIcon,
};

export function AttributionView(): ReactElement {
  const dispatch = useAppDispatch();
  const attributions: Attributions = useAppSelector(getManualAttributions);
  const selectedPackageCardIdInAttributionView: string = useAppSelector(
    getSelectedAttributionIdInAttributionView
  );
  const filteredAttributions = useFilters(attributions);
  const activeFilters = Array.from(useAppSelector(getActiveFilters));
  const [showMultiSelect, setShowMultiselect] = useState<boolean>(false);

  if (activeFilters.length !== 0 && !showMultiSelect) {
    setShowMultiselect(!showMultiSelect);
  }

  const { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos } =
    getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
      filteredAttributions
    );

  function onCardClick(packageCardId: string): void {
    // In AttributionView, attribtionIds still serve as packageCardIds
    const attributionId = packageCardId;
    dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const countAndSearchAndFilterOffset = showMultiSelect ? 137 : 80;

  return (
    <MuiBox sx={classes.root}>
      <AttributionList
        displayPackageInfos={filteredDisplayPackageInfos}
        sortedPackageCardIds={filteredAndSortedPackageCardIds}
        selectedPackageCardId={selectedPackageCardIdInAttributionView}
        onCardClick={onCardClick}
        sx={classes.attributionList}
        maxHeight={
          useWindowHeight() - topBarHeight - countAndSearchAndFilterOffset
        }
        title={<AttributionCountsPanel />}
        topRightElement={
          <IconButton
            tooltipTitle="Filters"
            tooltipPlacement="right"
            onClick={(): void => setShowMultiselect(!showMultiSelect)}
            disabled={activeFilters.length !== 0}
            icon={
              <FilterAltIcon
                aria-label={'Filter icon'}
                sx={
                  activeFilters.length !== 0
                    ? classes.disabledIcon
                    : classes.clickableIcon
                }
              />
            }
          />
        }
        filterElement={
          <FilterMultiSelect sx={showMultiSelect ? {} : { display: 'none' }} />
        }
      />
      <AttributionDetailsViewer />
    </MuiBox>
  );
}

function getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
  filteredAttributions: Attributions
): {
  filteredAndSortedPackageCardIds: Array<string>;
  filteredDisplayPackageInfos: DisplayPackageInfos;
} {
  const sortedAttributionIds = Object.keys(filteredAttributions).sort(
    getAlphabeticalComparer(filteredAttributions)
  );

  const filteredAndSortedPackageCardIds: Array<string> = [];
  const filteredDisplayPackageInfos: DisplayPackageInfos = {};

  sortedAttributionIds.forEach((attributionId) => {
    // In AttributionView, attribtionIds still serve as packageCardIds
    const packageCardId = attributionId;
    filteredAndSortedPackageCardIds.push(packageCardId);
    filteredDisplayPackageInfos[packageCardId] =
      convertPackageInfoToDisplayPackageInfo(
        filteredAttributions[attributionId],
        [attributionId]
      );
  });
  return { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos };
}
