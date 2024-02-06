// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';
import { ReactElement, useMemo } from 'react';

import { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PackagePanelTitle } from '../../enums/enums';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../shared-constants';
import { OpossumColors } from '../../shared-styles';
import { selectPackageCardInAuditViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getDisplayedPackage } from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionsOfSelectedResource,
  getAttributionsOfSelectedResourceOrClosestParent,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { sortAttributions } from '../../util/sort-attributions';
import { Button } from '../Button/Button';
import { ManualAttributionList } from '../ManualAttributionList/ManualAttributionList';

const classes = {
  root: {
    marginRight: '1px',
    padding: '8px',
    background: OpossumColors.white,
    border: `1px ${OpossumColors.white} solid`,
  },
  select: {
    backgroundColor: OpossumColors.white,
  },
  buttonDiv: {
    marginTop: '6px',
    marginBottom: '4px',
  },
};

interface ManualPackagePanelProps {
  showParentAttributions: boolean;
  overrideParentMode: boolean;
  showAddNewAttributionButton: boolean;
  onOverrideParentClick(): void;
}

export function ManualPackagePanel(
  props: ManualPackagePanelProps,
): ReactElement | null {
  const dispatch = useAppDispatch();
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const attributionsOfSelectedResource: Attributions = useAppSelector(
    getAttributionsOfSelectedResource,
  );
  const selectedResourceOrClosestParentAttributions: Attributions =
    useAppSelector(getAttributionsOfSelectedResourceOrClosestParent);
  const selectedResourceId: string = useAppSelector(getSelectedResourceId);

  const shownAttributionsOfResource: Attributions = props.overrideParentMode
    ? attributionsOfSelectedResource
    : selectedResourceOrClosestParentAttributions;

  const displayPackageInfos = useMemo(
    () =>
      sortAttributions({
        sorting: text.sortings.name,
        attributions: shownAttributionsOfResource,
      }),
    [shownAttributionsOfResource],
  );

  function onCardClick(
    packageCardId: string,
    isAddNewAttributionButton: boolean,
  ): void {
    selectedPackage?.packageCardId !== packageCardId &&
      dispatch(
        selectPackageCardInAuditViewOrOpenUnsavedPopup(
          PackagePanelTitle.ManualPackages,
          isAddNewAttributionButton
            ? ADD_NEW_ATTRIBUTION_BUTTON_ID
            : packageCardId,
          isAddNewAttributionButton
            ? EMPTY_DISPLAY_PACKAGE_INFO
            : displayPackageInfos[packageCardId],
        ),
      );
  }

  const showParentAttributions: boolean =
    props.showParentAttributions && !props.overrideParentMode;

  return (
    <MuiPaper
      aria-label={'resource attributions'}
      sx={classes.root}
      elevation={0}
      square={true}
    >
      <MuiTypography variant={'subtitle1'}>
        {showParentAttributions
          ? 'Attributions (from parents)'
          : 'Attributions'}
      </MuiTypography>
      <ManualAttributionList
        displayPackageInfos={displayPackageInfos}
        selectedResourceId={selectedResourceId}
        selectedPackageCardId={selectedPackage?.packageCardId}
        onCardClick={onCardClick}
        isAddNewAttributionItemShown={props.showAddNewAttributionButton}
      />
      <MuiBox sx={classes.buttonDiv}>
        {showParentAttributions && (
          <Button
            buttonText={'Override parent'}
            onClick={props.onOverrideParentClick}
          />
        )}
      </MuiBox>
    </MuiPaper>
  );
}
