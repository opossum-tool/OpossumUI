// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import React, { ReactElement, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import {
  getAttributionIdMarkedForReplacement,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
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
import {
  FollowUpIcon,
  IncompletePackagesIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import pickBy from 'lodash/pickBy';
import MuiTypography from '@mui/material/Typography';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';

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
  icons: {
    marginBottom: '-3.5px',
    marginLeft: '-3px',
    marginRight: '-2.5px',
  },
  titleFollowUpIcon: {
    color: OpossumColors.orange,
  },
  preselectedAttributionIcon: {
    color: OpossumColors.darkBlue,
  },
  incompleteAttributionIcon: {
    color: OpossumColors.lightOrange,
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
  const attributionIdMarkedForReplacement: string = useAppSelector(
    getAttributionIdMarkedForReplacement
  );

  function onCardClick(attributionId: string): void {
    dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
  }

  const filteredAttributions = useFilters(attributions);

  function getAttributionPanelTitle(): ReactElement {
    const numberOfAttributions = Object.keys(attributions).length;
    const numberOfFollowUps = Object.keys(
      pickBy(attributions, (value: PackageInfo) => value.followUp)
    ).length;
    const numberOfPreselectedAttributions = Object.keys(
      pickBy(attributions, (value: PackageInfo) => value.preSelected)
    ).length;

    const numberOfIncompleteAttributions = Object.keys(
      pickBy(attributions, (value: PackageInfo) =>
        isPackageInfoIncomplete(value)
      )
    ).length;

    return (
      <MuiTypography variant={'subtitle1'}>
        {`Attributions (${numberOfAttributions} total, ${numberOfFollowUps}`}
        <FollowUpIcon
          sx={{
            ...classes.titleFollowUpIcon,
            ...classes.icons,
          }}
        />
        {`, ${numberOfPreselectedAttributions}`}
        <PreSelectedIcon
          sx={{
            ...classes.preselectedAttributionIcon,
            ...classes.icons,
          }}
        />
        {`, ${numberOfIncompleteAttributions}`}
        <IncompletePackagesIcon
          sx={{
            ...classes.incompleteAttributionIcon,
            ...classes.icons,
          }}
        />
        )
      </MuiTypography>
    );
  }

  const activeFilters = Array.from(useAppSelector(getActiveFilters));

  const [showMultiSelect, setShowMultiselect] = useState<boolean>(false);

  if (activeFilters.length !== 0 && !showMultiSelect) {
    setShowMultiselect(!showMultiSelect);
  }

  const countAndSearchAndFilterOffset = showMultiSelect ? 137 : 80;

  return (
    <MuiBox sx={classes.root}>
      <AttributionList
        attributions={filteredAttributions}
        selectedAttributionId={selectedAttributionId}
        attributionIdMarkedForReplacement={attributionIdMarkedForReplacement}
        onCardClick={onCardClick}
        sx={classes.attributionList}
        maxHeight={
          useWindowHeight() - topBarHeight - countAndSearchAndFilterOffset
        }
        title={getAttributionPanelTitle()}
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
