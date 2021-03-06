// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
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
  getCurrentAttributionId,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { PackageCard } from '../PackageCard/PackageCard';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { getPopupAttributionId } from '../../state/selectors/view-selector';
import MuiBox from '@mui/material/Box';

const classes = {
  typography: {
    margin: '5px',
  },
  contentRoot: {
    maxWidth: '430px',
  },
};

export function ReplaceAttributionPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const attributions = useAppSelector(getManualAttributions);
  const markedAttributionId = useAppSelector(
    getAttributionIdMarkedForReplacement
  );
  const targetAttributionId = useAppSelector(getPopupAttributionId);
  const selectedAttributionId =
    useAppSelector(getCurrentAttributionId) ?? undefined;

  function handleCancelClick(): void {
    dispatch(closePopup());
  }

  function handleReplaceClick(): void {
    targetAttributionId &&
      dispatch(
        savePackageInfo(
          null,
          markedAttributionId,
          attributions[targetAttributionId],
          markedAttributionId !== selectedAttributionId
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
    <MuiBox sx={classes.contentRoot}>
      <MuiTypography sx={classes.typography}>
        This removes the following attribution
      </MuiTypography>
      {getAttributionCard(markedAttributionId)}
      <MuiTypography sx={classes.typography}>
        and links its resources to the attribution
      </MuiTypography>
      {targetAttributionId && getAttributionCard(targetAttributionId)}
    </MuiBox>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Replacing an attribution'}
      leftButtonConfig={{
        onClick: handleReplaceClick,
        buttonText: ButtonText.Replace,
      }}
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
      }}
      isOpen={true}
    />
  );
}
