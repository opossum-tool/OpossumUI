// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography';
import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

const useStyles = makeStyles({
  root: {
    marginRight: 1,
    padding: 8,
    background: OpossumColors.white,
    border: `1px ${OpossumColors.white} solid`,
  },
  select: {
    backgroundColor: OpossumColors.white,
  },
  buttonDiv: {
    marginTop: 6,
    marginBottom: 4,
  },
});

interface ManualPackagePanelProps {
  showParentAttributions: boolean;
  overrideParentMode: boolean;
  showAddNewAttributionButton: boolean;
  onOverrideParentClick(): void;
}

export function ManualPackagePanel(
  props: ManualPackagePanelProps
): ReactElement | null {
  const classes = useStyles();
  const dispatch = useDispatch();

  const selectedAttributionId: string | null = useSelector(
    getAttributionIdOfDisplayedPackageInManualPanel
  );

  const attributionIdsOfSelectedResource: Attributions = useSelector(
    getAttributionsOfSelectedResource
  );
  const selectedResourceOrClosestParentAttributions: Attributions = useSelector(
    getAttributionsOfSelectedResourceOrClosestParent
  );

  const selectedResourceId: string = useSelector(getSelectedResourceId);

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
    <MuiPaper className={classes.root} elevation={0} square={true}>
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
      <div className={classes.buttonDiv}>
        {showParentAttributions && (
          <Button
            buttonText={'Override parent'}
            isDark={true}
            onClick={props.onOverrideParentClick}
          />
        )}
      </div>
    </MuiPaper>
  );
}
