// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import MuiBox from '@mui/material/Box';
import { useState } from 'react';

import { Attributions } from '../../../shared/shared-types';
import {
  clickableIcon,
  disabledIcon,
  OpossumColors,
} from '../../shared-styles';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';
import { DisplayPackageInfos } from '../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { getAlphabeticalComparerForAttributions } from '../../util/get-alphabetical-comparer';
import { AttributionCountsPanel } from '../AttributionCountsPanel/AttributionCountsPanel';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer/AttributionDetailsViewer';
import { AttributionList } from '../AttributionList/AttributionList';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';
import { useFilteredAttributions } from '../Filter/FilterMultiSelect.util';
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

export function AttributionView() {
  const dispatch = useAppDispatch();
  const selectedPackageCardIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const { attributions, activeFilters } = useFilteredAttributions();
  const hasActiveFilters = !!activeFilters.length;
  const [showMultiSelect, setShowMultiselect] = useState(hasActiveFilters);

  const { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos } =
    getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(attributions);

  return (
    <MuiBox sx={classes.root}>
      <AttributionList
        displayPackageInfos={filteredDisplayPackageInfos}
        sortedPackageCardIds={filteredAndSortedPackageCardIds}
        selectedPackageCardId={selectedPackageCardIdInAttributionView}
        onCardClick={(id) =>
          dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(id))
        }
        sx={classes.attributionList}
        title={<AttributionCountsPanel />}
        topRightElement={
          <IconButton
            tooltipTitle={'Filters'}
            tooltipPlacement={'right'}
            onClick={() => setShowMultiselect((prev) => !prev)}
            disabled={hasActiveFilters}
            icon={
              <FilterAltIcon
                sx={
                  hasActiveFilters
                    ? classes.disabledIcon
                    : classes.clickableIcon
                }
              />
            }
          />
        }
        filterElement={
          showMultiSelect ? (
            <FilterMultiSelect sx={{ marginTop: '8px' }} />
          ) : undefined
        }
      />
      <AttributionDetailsViewer />
    </MuiBox>
  );
}

function getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
  attributions: Attributions,
): {
  filteredAndSortedPackageCardIds: Array<string>;
  filteredDisplayPackageInfos: DisplayPackageInfos;
} {
  const sortedAttributionIds = Object.keys(attributions).sort(
    getAlphabeticalComparerForAttributions(attributions),
  );

  const filteredAndSortedPackageCardIds: Array<string> = [];
  const filteredDisplayPackageInfos: DisplayPackageInfos = {};

  sortedAttributionIds.forEach((attributionId) => {
    filteredAndSortedPackageCardIds.push(attributionId);
    filteredDisplayPackageInfos[attributionId] =
      convertPackageInfoToDisplayPackageInfo(attributions[attributionId], [
        attributionId,
      ]);
  });
  return { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos };
}
