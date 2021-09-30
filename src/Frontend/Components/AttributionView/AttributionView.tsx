// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { getManualAttributions } from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionIdMarkedForReplacement,
  getSelectedAttributionId,
} from '../../state/selectors/attribution-view-resource-selectors';
import { useFollowUpFilter } from '../../util/use-follow-up-filter';
import { topBarOffset, useWindowHeight } from '../../util/use-window-height';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer/AttributionDetailsViewer';
import { AttributionList } from '../AttributionList/AttributionList';
import { Checkbox } from '../Checkbox/Checkbox';
import { OpossumColors } from '../../shared-styles';

const countAndSearchOffset = 100;

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
  const dispatch = useDispatch();
  const attributions: Attributions = useSelector(getManualAttributions);
  const selectedAttributionId: string = useSelector(getSelectedAttributionId);
  const attributionIdMarkedForReplacement: string = useSelector(
    getAttributionIdMarkedForReplacement
  );

  const { filterForFollowUp, handleFilterChange, getFilteredAttributions } =
    useFollowUpFilter();

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
        maxHeight={useWindowHeight() - topBarOffset - countAndSearchOffset}
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
