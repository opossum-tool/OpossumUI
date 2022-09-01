// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import React, { ReactElement, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Attributions, PackageInfo } from '../../../shared/shared-types';
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
import { FollowUpIcon } from '../Icons/Icons';
import pickBy from 'lodash/pickBy';
import MuiTypography from '@mui/material/Typography';

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
  titleFollowUpIcon: {
    color: OpossumColors.orange,
    marginBottom: '-4.5px',
    marginLeft: '-3px',
    marginRight: '-2.5px',
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
  function onCardClick(attributionId: string): void {
    dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
  }

  const filteredAttributions = useFilters(attributions);

  function getAttributionPanelTitle(): JSX.Element {
    const numberOfAttributions = Object.keys(attributions).length;
    const titleWithFollowUp = (
      <MuiTypography variant={'subtitle1'}>
        {`Attributions (${numberOfAttributions} total, ${
          Object.keys(
            pickBy(attributions, (value: PackageInfo) => value.followUp)
          ).length
        }
      `}
        <FollowUpIcon sx={classes.titleFollowUpIcon} />)
      </MuiTypography>
    );

    const titleWithoutFollowUp = (
      <MuiTypography
        variant={'subtitle1'}
      >{`Attributions (${numberOfAttributions})`}</MuiTypography>
    );

    return numberOfAttributions ? titleWithFollowUp : titleWithoutFollowUp;
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
