// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
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
import { OpossumColors } from '../../shared-styles';
import { topBarHeight } from '../TopBar/TopBar';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';

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

  function onCardClick(attributionId: string): void {
    dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
  }

  const filteredAttributions = useFilters(attributions);
  const title = `${PackagePanelTitle.AllAttributions} (${
    Object.keys(attributions).length
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
        topRightElement={<FilterMultiSelect />}
      />
      <AttributionDetailsViewer />
    </div>
  );
}
