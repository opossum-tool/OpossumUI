// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { InputAdornment, SxProps } from '@mui/material';
import MuiTextField from '@mui/material/TextField';
import { Search } from '@mui/icons-material';
import { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';
import { inputElementClasses } from '../InputElements/shared';

const classes = {
  searchField: {
    marginTop: '4px',
    marginBottom: '8px',
    '& div': {
      borderRadius: '0px',
    },
  },
  endAdornment: {
    width: '20px',
    color: OpossumColors.grey,
  },
};

interface SearchTextFieldProps {
  onInputChange(search: string): void;
  search: string;
  autoFocus?: boolean;
  showIcon: boolean;
  sx?: SxProps;
}

export function SearchTextField(props: SearchTextFieldProps): ReactElement {
  return (
    <MuiTextField
      label="Search"
      type="search"
      variant="outlined"
      autoFocus={props.autoFocus ?? false}
      size="small"
      sx={getSxFromPropsAndClasses({
        styleClass: {
          ...classes.searchField,
          ...inputElementClasses.textField,
        },
        sxProps: props.sx,
      })}
      value={props.search}
      fullWidth={true}
      onChange={(event): void => props.onInputChange(event.target.value)}
      InputProps={
        props.showIcon
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <Search sx={classes.endAdornment} />
                </InputAdornment>
              ),
            }
          : {}
      }
    />
  );
}
