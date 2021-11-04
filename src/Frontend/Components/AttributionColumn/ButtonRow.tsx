// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement } from 'react';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { ButtonGroup, MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import MuiTypography from '@material-ui/core/Typography';
import { ButtonText } from '../../enums/enums';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';

const useStyles = makeStyles({
  root: {
    marginLeft: 10,
    marginTop: 5,
  },
  buttonRow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    marginRight: 8,
    marginBottom: 16,
    marginLeft: 'auto',
  },
  resolveButton: {
    marginTop: 0,
    marginRight: 0,
  },
});

interface ButtonRowProps {
  showButtonGroup: boolean;
  areButtonsHidden?: boolean;
  selectedPackageIsResolved: boolean;
  resolvedToggleHandler(): void;
  displayTexts: Array<string>;
  mainButtonConfigs: Array<MainButtonConfig>;
  hamburgerMenuButtonConfigs?: Array<ContextMenuItem>;
}

export function ButtonRow(props: ButtonRowProps): ReactElement {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {props.displayTexts.map((text, index) => (
        <MuiTypography variant={'subtitle1'} key={`${text}-${index}`}>
          {text}
        </MuiTypography>
      ))}
      <div className={classes.buttonRow}>
        {props.showButtonGroup ? (
          <ButtonGroup
            isHidden={props.areButtonsHidden}
            mainButtonConfigs={props.mainButtonConfigs}
            hamburgerMenuButtonConfigs={props.hamburgerMenuButtonConfigs}
          />
        ) : (
          <ToggleButton
            buttonText={ButtonText.Hide}
            className={classes.resolveButton}
            selected={props.selectedPackageIsResolved}
            handleChange={props.resolvedToggleHandler}
            ariaLabel={'resolve attribution'}
          />
        )}
      </div>
    </div>
  );
}
