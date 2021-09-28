// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ButtonTitle } from '../../enums/enums';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { doNothing } from '../../util/do-nothing';
import MuiTypography from '@material-ui/core/Typography';
import {
  getAttributionIdMarkedForReplacement,
  getSelectedAttributionId,
} from '../../state/selectors/attribution-view-resource-selectors';
import { getManualAttributions } from '../../state/selectors/all-views-resource-selectors';
import { PackageCard } from '../PackageCard/PackageCard';
import { makeStyles } from '@material-ui/core/styles';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';

const useStyles = makeStyles({
  typography: {
    margin: 5,
  },
});

export function ReplaceAttributionPopup(): ReactElement {
  const classes = useStyles();

  const dispatch = useDispatch();
  const attributions = useSelector(getManualAttributions);
  const markedAttributionId = useSelector(getAttributionIdMarkedForReplacement);
  const selectedAttributionId = useSelector(getSelectedAttributionId);

  function handleCancelClick(): void {
    dispatch(closePopup());
  }

  function handleOkClick(): void {
    dispatch(
      savePackageInfo(
        null,
        markedAttributionId,
        attributions[selectedAttributionId]
      )
    );
    dispatch(setAttributionIdMarkedForReplacement(''));
    dispatch(closePopup());
  }

  function getAttributionCard(attributionId: string): ReactElement {
    const attribution = attributions[attributionId];

    return (
      <PackageCard
        onClick={doNothing}
        cardConfig={{}}
        cardContent={{
          id: `attribution-list-${attributionId}`,
          name: attribution?.packageName,
          packageVersion: attribution?.packageVersion,
          copyright: attribution?.copyright,
          licenseText: attribution?.licenseText,
          comment: attribution?.comment,
          url: attribution?.url,
          licenseName: attribution?.licenseName,
        }}
      />
    );
  }

  const content = (
    <div>
      <MuiTypography className={classes.typography}>
        This removes the following attribution
      </MuiTypography>
      {getAttributionCard(markedAttributionId)}
      <MuiTypography className={classes.typography}>
        and links its resources to the current attribution
      </MuiTypography>
      {getAttributionCard(selectedAttributionId)}
    </div>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Warning'}
      leftButtonTitle={ButtonTitle.Replace}
      onLeftButtonClick={handleOkClick}
      rightButtonTitle={ButtonTitle.Cancel}
      onRightButtonClick={handleCancelClick}
      isOpen={true}
    />
  );
}
