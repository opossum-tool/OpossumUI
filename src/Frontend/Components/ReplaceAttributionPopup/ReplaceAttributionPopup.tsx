// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { ButtonText } from '../../enums/enums';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionIdMarkedForReplacement,
  getCurrentAttributionId,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { getPopupAttributionId } from '../../state/selectors/view-selector';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { doNothing } from '../../util/do-nothing';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PackageCard } from '../PackageCard/PackageCard';

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
    getAttributionIdMarkedForReplacement,
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
          markedAttributionId !== selectedAttributionId,
        ),
      );
    dispatch(setAttributionIdMarkedForReplacement(''));
    dispatch(closePopup());
  }

  function getPackageCard(attributionId: string): ReactElement {
    const displayPackageInfo = convertPackageInfoToDisplayPackageInfo(
      attributions[attributionId],
      [attributionId],
    );

    return (
      <PackageCard
        onClick={doNothing}
        cardConfig={{}}
        hideContextMenuAndMultiSelect={true}
        cardId={`attribution-list-${attributionId}`}
        displayPackageInfo={displayPackageInfo}
      />
    );
  }

  const content = (
    <MuiBox sx={classes.contentRoot}>
      <MuiTypography sx={classes.typography}>
        This removes the following attribution
      </MuiTypography>
      {markedAttributionId && getPackageCard(markedAttributionId)}
      <MuiTypography sx={classes.typography}>
        and links its resources to the attribution
      </MuiTypography>
      {targetAttributionId && getPackageCard(targetAttributionId)}
    </MuiBox>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Replacing an attribution'}
      leftButtonConfig={{
        onClick: handleReplaceClick,
        buttonText: ButtonText.Replace,
        isDark: true,
      }}
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
      }}
      isOpen={true}
      aria-label={'replace attribution popup'}
    />
  );
}
