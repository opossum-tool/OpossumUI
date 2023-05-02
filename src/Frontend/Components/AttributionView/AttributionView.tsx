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
import { getSelectedAttributionId } from '../../state/selectors/attribution-view-resource-selectors';
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
import { DisplayAttributionWithCount } from '../../types/types';
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
  const selectedAttributionId: string = useAppSelector(
    getSelectedAttributionId
  );
  const filteredAttributions = useFilters(attributions);
  const activeFilters = Array.from(useAppSelector(getActiveFilters));
  const [showMultiSelect, setShowMultiselect] = useState<boolean>(false);

  if (activeFilters.length !== 0 && !showMultiSelect) {
    setShowMultiselect(!showMultiSelect);
  }

  const sortedAttributionIds = Object.keys(filteredAttributions).sort(
    getAlphabeticalComparer(filteredAttributions)
  );

  const filteredAndSortedDisplayAttributions: Array<DisplayAttributionWithCount> =
    sortedAttributionIds.map((attributionId) => {
      return {
        attributionId,
        attribution: convertPackageInfoToDisplayPackageInfo(
          filteredAttributions[attributionId],
          [attributionId]
        ),
      };
    });

  function onCardClick(attributionId: string): void {
    dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const countAndSearchAndFilterOffset = showMultiSelect ? 137 : 80;

  return (
    <MuiBox sx={classes.root}>
      <AttributionList
        displayAttributions={filteredAndSortedDisplayAttributions}
        selectedAttributionId={selectedAttributionId}
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
