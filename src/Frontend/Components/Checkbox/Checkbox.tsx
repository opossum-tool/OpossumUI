// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiCheckbox from '@mui/material/Checkbox';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { OpossumColors } from '../../shared-styles';

const classes = {
  disabledLabel: {
    color: OpossumColors.disabledGrey,
  },
  skeleton: {
    fill: 'rgba(0, 0, 0, 0.6)',
  },
};

interface CheckboxProps {
  label?: string;
  disabled?: boolean;
  checked: boolean;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  sx?: SxProps;
  skeleton?: boolean;
}

export function Checkbox(props: CheckboxProps): ReactElement {
  const Icon = props.checked ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

  return (
    <MuiBox sx={props.sx}>
      {props.skeleton ? (
        <Icon sx={classes.skeleton} />
      ) : (
        <MuiCheckbox
          disabled={props.disabled}
          checked={props.checked}
          onChange={props.onChange}
          inputProps={{
            'aria-label': `checkbox ${props.label}`,
          }}
          color={'default'}
        />
      )}
      {props.label ? (
        <MuiTypography sx={props.disabled ? classes.disabledLabel : {}}>
          {props.label}
        </MuiTypography>
      ) : null}
    </MuiBox>
  );
}
