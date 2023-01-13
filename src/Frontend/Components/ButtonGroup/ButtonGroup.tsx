// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiButtonGroup from '@mui/material/ButtonGroup';
import { Button } from '../Button/Button';
import { HamburgerMenu } from '../HamburgerMenu/HamburgerMenu';
import MuiBox from '@mui/material/Box';

import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import { SxProps } from '@mui/material';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

const classes = {
  root: {
    marginTop: '10px',
    justifyContent: 'space-evenly',
    display: 'flex',
  },
};

export interface MainButtonConfig {
  buttonText: string;
  disabled?: boolean;
  onClick(event: React.MouseEvent<HTMLButtonElement>): void;
  hidden: boolean;
}

interface ButtonGroupProps {
  mainButtonConfigs: Array<MainButtonConfig>;
  hamburgerMenuButtonConfigs?: Array<ContextMenuItem>;
  isHidden?: boolean;
  sx?: SxProps;
}

export function ButtonGroup(props: ButtonGroupProps): ReactElement | null {
  return props.isHidden ? null : (
    <MuiBox
      sx={getSxFromPropsAndClasses({
        styleClass: classes.root,
        sxProps: props.sx,
      })}
    >
      <MuiButtonGroup disableElevation variant="contained">
        {props.mainButtonConfigs
          .filter((buttonConfig) => !buttonConfig.hidden)
          .map((buttonConfig, idx) => (
            <Button
              {...buttonConfig}
              isDark={false}
              key={`button-group-${buttonConfig.buttonText}-${idx}`}
            />
          ))}
        {props.hamburgerMenuButtonConfigs ? (
          <HamburgerMenu menuItems={props.hamburgerMenuButtonConfigs} />
        ) : null}
      </MuiButtonGroup>
    </MuiBox>
  );
}
