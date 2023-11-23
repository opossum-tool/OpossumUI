// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import {
  FormControlLabel,
  FormControlLabelProps,
  SxProps,
} from '@mui/material';
import MuiCheckbox from '@mui/material/Checkbox';
import { ReactElement } from 'react';

const classes = {
  skeleton: {
    fill: 'rgba(0, 0, 0, 0.6)',
  },
};

interface CheckboxProps extends Pick<FormControlLabelProps, 'labelPlacement'> {
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
    <FormControlLabel
      sx={{
        ...props.sx,
        marginLeft: 'unset',
        marginRight: !props.label ? 'unset' : undefined,
      }}
      label={props.label}
      disabled={props.disabled}
      labelPlacement={props.labelPlacement}
      control={
        props.skeleton ? (
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
        )
      }
    />
  );
}
