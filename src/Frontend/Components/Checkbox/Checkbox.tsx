// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  FormControlLabel,
  FormControlLabelProps,
  SxProps,
} from '@mui/material';
import MuiCheckbox from '@mui/material/Checkbox';

interface CheckboxProps extends Pick<FormControlLabelProps, 'labelPlacement'> {
  checked: boolean;
  disableRipple?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  label?: string;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  ref?: React.RefObject<HTMLButtonElement>;
  sx?: SxProps;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  disableRipple,
  disabled,
  indeterminate,
  label,
  labelPlacement,
  onChange,
  ref,
  sx,
  ...props
}) => {
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
        <MuiCheckbox
          {...props}
          ref={ref}
          disabled={disabled}
          indeterminate={indeterminate}
          checked={checked}
          onChange={onChange}
          inputProps={{
            style: { zIndex: 'unset' },
          }}
          disableRipple={disableRipple}
          size={'small'}
          sx={{ padding: '7px' }}
        />
      }
    />
  );
};
