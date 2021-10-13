// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiButtonGroup from '@material-ui/core/ButtonGroup';
import { Button } from '../Button/Button';
import { ContextMenuButton } from '../ContextMenuButton/ContextMenuButton';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { ContextMenuItem } from '../ContextMenu/WithContextMenu';

const useStyles = makeStyles({
  root: {
    marginTop: 10,
    justifyContent: 'space-evenly',
    display: 'flex',
  },
});

export interface MainButtonConfig {
  buttonText: string;
  disabled?: boolean;
  onClick(event: React.MouseEvent<HTMLButtonElement>): void;
  hidden: boolean;
}

interface ButtonGroupProps {
  mainButtonConfigs: Array<MainButtonConfig>;
  contextMenuButtonConfigs?: Array<ContextMenuItem>;
  isHidden?: boolean;
  className?: string;
}

export function ButtonGroup(props: ButtonGroupProps): ReactElement | null {
  const classes = useStyles();

  return props.isHidden ? null : (
    <div className={clsx(classes.root, props.className)}>
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
        {props.contextMenuButtonConfigs ? (
          <ContextMenuButton menuItems={props.contextMenuButtonConfigs} />
        ) : null}
      </MuiButtonGroup>
    </div>
  );
}
