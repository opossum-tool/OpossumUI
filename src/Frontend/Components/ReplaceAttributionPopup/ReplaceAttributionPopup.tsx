// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { ButtonText } from '../../enums/enums';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { doNothing } from '../../util/do-nothing';
import MuiTypography from '@mui/material/Typography';
import {
  getAttributionIdMarkedForReplacement,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { PackageCard } from '../PackageCard/PackageCard';
import makeStyles from '@mui/styles/makeStyles';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { getTargetAttributionId } from '../../state/selectors/view-selector';

const useStyles = makeStyles({
  typography: {
    margin: 5,
  },
  contentRoot: {
    maxWidth: 430,
  },
});

export function ReplaceAttributionPopup(): ReactElement {
  const classes = useStyles();

  const dispatch = useAppDispatch();
  const attributions = useAppSelector(getManualAttributions);
  const markedAttributionId = useAppSelector(
    getAttributionIdMarkedForReplacement
  );
  const targetAttributionId = useAppSelector(getTargetAttributionId);

  function handleCancelClick(): void {
    dispatch(closePopup());
  }

  function handleOkClick(): void {
    dispatch(
      savePackageInfo(
        null,
        markedAttributionId,
        attributions[targetAttributionId]
      )
    );
    dispatch(setAttributionIdMarkedForReplacement(''));
    dispatch(closePopup());
  }

  function getAttributionCard(attributionId: string): ReactElement {
    const attribution = attributions[attributionId];

    return (
      <PackageCard
        attributionId={attributionId}
        onClick={doNothing}
        cardConfig={{}}
        hideContextMenuAndMultiSelect={true}
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
    <div className={classes.contentRoot}>
      <MuiTypography className={classes.typography}>
        This removes the following attribution
      </MuiTypography>
      {getAttributionCard(markedAttributionId)}
      <MuiTypography className={classes.typography}>
        and links its resources to the attribution
      </MuiTypography>
      {getAttributionCard(targetAttributionId)}
    </div>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Replacing an attribution'}
      leftButtonText={ButtonText.Replace}
      onLeftButtonClick={handleOkClick}
      rightButtonText={ButtonText.Cancel}
      onRightButtonClick={handleCancelClick}
      isOpen={true}
    />
  );
}
