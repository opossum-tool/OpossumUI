// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { selectAttributionInManualPackagePanelOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getAttributionsOfSelectedResource,
  getAttributionsOfSelectedResourceOrClosestParent,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { Button } from '../Button/Button';
import { ManualAttributionList } from '../ManualAttributionList/ManualAttributionList';
import { OpossumColors } from '../../shared-styles';
import MuiBox from '@mui/material/Box';

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
  props: ManualPackagePanelProps
): ReactElement | null {
  const dispatch = useAppDispatch();

  const selectedAttributionId: string | null = useAppSelector(
    getAttributionIdOfDisplayedPackageInManualPanel
  );

  const attributionIdsOfSelectedResource: Attributions = useAppSelector(
    getAttributionsOfSelectedResource
  );
  const selectedResourceOrClosestParentAttributions: Attributions =
    useAppSelector(getAttributionsOfSelectedResourceOrClosestParent);

  const selectedResourceId: string = useAppSelector(getSelectedResourceId);

  const shownAttributionsOfResource: Attributions = props.overrideParentMode
    ? attributionIdsOfSelectedResource
    : selectedResourceOrClosestParentAttributions;

  function onCardClick(
    attributionId: string,
    isAddNewAttributionItemShown: boolean
  ): void {
    dispatch(
      selectAttributionInManualPackagePanelOrOpenUnsavedPopup(
        PackagePanelTitle.ManualPackages,
        isAddNewAttributionItemShown ? '' : attributionId
      )
    );
  }

  const showParentAttributions: boolean =
    props.showParentAttributions && !props.overrideParentMode;

  return (
    <MuiPaper sx={classes.root} elevation={0} square={true}>
      <MuiTypography variant={'subtitle1'}>
        {showParentAttributions
          ? 'Attributions (from parents)'
          : 'Attributions'}
      </MuiTypography>
      <ManualAttributionList
        selectedResourceId={selectedResourceId}
        attributions={shownAttributionsOfResource}
        selectedAttributionId={selectedAttributionId}
        isAddNewAttributionItemShown={props.showAddNewAttributionButton}
        onCardClick={onCardClick}
      />
      <MuiBox sx={classes.buttonDiv}>
        {showParentAttributions && (
          <Button
            buttonText={'Override parent'}
            isDark={true}
            onClick={props.onOverrideParentClick}
          />
        )}
      </MuiBox>
    </MuiPaper>
  );
}
