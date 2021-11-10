// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Attributions } from '../../../shared/shared-types';
import { FilterType, PackagePanelTitle } from '../../enums/enums';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { getManualAttributions } from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionIdMarkedForReplacement,
  getSelectedAttributionId,
} from '../../state/selectors/attribution-view-resource-selectors';
import { provideFollowUpFilter } from '../../util/provide-follow-up-filter';
import { useWindowHeight } from '../../util/use-window-height';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer/AttributionDetailsViewer';
import { AttributionList } from '../AttributionList/AttributionList';
import { Checkbox } from '../Checkbox/Checkbox';
import { OpossumColors } from '../../shared-styles';
import { topBarHeight } from '../TopBar/TopBar';
import { getActiveFilters } from '../../state/selectors/view-selector';

const countAndSearchOffset = 119;

const useStyles = makeStyles({
  root: {
    width: '100%',
    display: 'flex',
    backgroundColor: OpossumColors.white,
  },
  attributionList: {
    width: '30%',
    margin: 5,
  },
  checkBox: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
  },
});

export function AttributionView(): ReactElement {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const attributions: Attributions = useAppSelector(getManualAttributions);
  const selectedAttributionId: string = useAppSelector(
    getSelectedAttributionId
  );
  const attributionIdMarkedForReplacement: string = useAppSelector(
    getAttributionIdMarkedForReplacement
  );
  const activeFilters = useAppSelector(getActiveFilters);
  const filterForFollowUp = activeFilters.has(FilterType.OnlyFollowUp);

  const { handleFilterChange, getFilteredAttributions } = provideFollowUpFilter(
    filterForFollowUp,
    dispatch
  );

  function onCardClick(attributionId: string): void {
    dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
  }

  const filteredAttributions = getFilteredAttributions(attributions);
  const title = `${PackagePanelTitle.AllAttributions} (${
    Object.keys(attributions).length
  })`;
  const checkBoxLabel = `Show only follow-up (${
    Object.values(attributions).filter((attribution) => attribution.followUp)
      .length
  })`;

  return (
    <div className={classes.root}>
      <AttributionList
        attributions={filteredAttributions}
        selectedAttributionId={selectedAttributionId}
        attributionIdMarkedForReplacement={attributionIdMarkedForReplacement}
        onCardClick={onCardClick}
        className={classes.attributionList}
        maxHeight={useWindowHeight() - topBarHeight - countAndSearchOffset}
        title={title}
        topRightElement={
          <Checkbox
            label={checkBoxLabel}
            checked={filterForFollowUp}
            onChange={handleFilterChange}
            className={classes.checkBox}
          />
        }
      />
      <AttributionDetailsViewer />
    </div>
  );
}
