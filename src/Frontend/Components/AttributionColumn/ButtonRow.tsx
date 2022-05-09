// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { ButtonGroup, MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import MuiTypography from '@mui/material/Typography';
import { ButtonText } from '../../enums/enums';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import MuiBox from '@mui/material/Box';

const classes = {
  root: {
    marginLeft: '10px',
    marginTop: '5px',
  },
  buttonRow: {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    marginRight: '8px',
    marginBottom: '16px',
    marginLeft: 'auto',
  },
  resolveButton: {
    marginTop: '0px',
    marginRight: '0px',
  },
};

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
  return (
    <MuiBox sx={classes.root}>
      {props.displayTexts.map((text, index) => (
        <MuiTypography variant={'subtitle1'} key={`${text}-${index}`}>
          {text}
        </MuiTypography>
      ))}
      <MuiBox sx={classes.buttonRow}>
        {props.showButtonGroup ? (
          <ButtonGroup
            isHidden={props.areButtonsHidden}
            mainButtonConfigs={props.mainButtonConfigs}
            hamburgerMenuButtonConfigs={props.hamburgerMenuButtonConfigs}
          />
        ) : (
          <ToggleButton
            buttonText={ButtonText.Hide}
            sx={classes.resolveButton}
            selected={props.selectedPackageIsResolved}
            handleChange={props.resolvedToggleHandler}
            ariaLabel={'resolve attribution'}
          />
        )}
      </MuiBox>
    </MuiBox>
  );
}
