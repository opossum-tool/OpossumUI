// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiButtonGroup from '@mui/material/ButtonGroup';
import { ReactElement } from 'react';

import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';
import { Button } from '../Button/Button';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import { HamburgerMenu } from '../HamburgerMenu/HamburgerMenu';

const classes = {
  root: {
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
  sx?: SxProps;
}

export function ButtonGroup(props: ButtonGroupProps): ReactElement {
  return (
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
