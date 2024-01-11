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
import { forwardRef } from 'react';

const classes = {
  skeleton: {
    fill: 'rgba(0, 0, 0, 0.6)',
    width: '42px',
  },
};

interface CheckboxProps extends Pick<FormControlLabelProps, 'labelPlacement'> {
  label?: string;
  disabled?: boolean;
  checked: boolean;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  sx?: SxProps;
  skeleton?: boolean;
  disableRipple?: boolean;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      checked,
      onChange,
      disableRipple,
      disabled,
      label,
      labelPlacement,
      skeleton,
      sx,
      ...props
    },
    ref,
  ) => {
    const Icon = checked ? CheckBoxIcon : CheckBoxOutlineBlankIcon;

    return (
      <FormControlLabel
        sx={{
          ...sx,
          marginLeft: 'unset',
          marginRight: !label ? 'unset' : undefined,
        }}
        label={label}
        disabled={disabled}
        labelPlacement={labelPlacement}
        control={
          skeleton ? (
            <Icon sx={classes.skeleton} />
          ) : (
            <MuiCheckbox
              {...props}
              ref={ref}
              disabled={disabled}
              checked={checked}
              onChange={onChange}
              inputProps={{
                'aria-label': `checkbox ${label}`,
              }}
              color={'default'}
              disableRipple={disableRipple}
            />
          )
        }
      />
    );
  },
);
