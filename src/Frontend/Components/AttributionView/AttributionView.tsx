// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import MuiBox from '@mui/material/Box';
import { ReactElement, useState } from 'react';

import { Attributions } from '../../../shared/shared-types';
import {
  clickableIcon,
  disabledIcon,
  OpossumColors,
} from '../../shared-styles';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getManualAttributions } from '../../state/selectors/all-views-resource-selectors';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';
import { getActiveFilters } from '../../state/selectors/view-selector';
import { DisplayPackageInfos } from '../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { getAlphabeticalComparerForAttributions } from '../../util/get-alphabetical-comparer';
import { useFilters } from '../../util/use-filters';
import { AttributionCountsPanel } from '../AttributionCountsPanel/AttributionCountsPanel';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer/AttributionDetailsViewer';
import { AttributionList } from '../AttributionList/AttributionList';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';
import { IconButton } from '../IconButton/IconButton';

const classes = {
  root: {
    width: '100%',
    display: 'flex',
    backgroundColor: OpossumColors.white,
  },
  attributionList: {
    margin: '5px',
    display: 'flex',
    flexDirection: 'column',
  },
  disabledIcon,
  clickableIcon,
};

export function AttributionView(): ReactElement {
  const dispatch = useAppDispatch();
  const attributions: Attributions = useAppSelector(getManualAttributions);
  const selectedPackageCardIdInAttributionView: string = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const filteredAttributions = useFilters(attributions);
  const activeFilters = Array.from(useAppSelector(getActiveFilters));
  const [showMultiSelect, setShowMultiselect] = useState<boolean>(false);

  if (activeFilters.length !== 0 && !showMultiSelect) {
    setShowMultiselect(!showMultiSelect);
  }

  const { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos } =
    getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
      filteredAttributions,
    );

  function onCardClick(packageCardId: string): void {
    // In AttributionView, attributionIds still serve as packageCardIds
    const attributionId = packageCardId;
    dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
  }

  return (
    <MuiBox sx={classes.root}>
      <AttributionList
        displayPackageInfos={filteredDisplayPackageInfos}
        sortedPackageCardIds={filteredAndSortedPackageCardIds}
        selectedPackageCardId={selectedPackageCardIdInAttributionView}
        onCardClick={onCardClick}
        sx={classes.attributionList}
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
  filteredAttributions: Attributions,
): {
  filteredAndSortedPackageCardIds: Array<string>;
  filteredDisplayPackageInfos: DisplayPackageInfos;
} {
  const sortedAttributionIds = Object.keys(filteredAttributions).sort(
    getAlphabeticalComparerForAttributions(filteredAttributions),
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
        [attributionId],
      );
  });
  return { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos };
}
