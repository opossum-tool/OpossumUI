// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import ClearIcon from '@mui/icons-material/Clear';
import { InputAdornment, SxProps } from '@mui/material';
import MuiTextField from '@mui/material/TextField';
import { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';
import { inputElementClasses } from '../InputElements/shared';

const classes = {
  searchField: {
    marginTop: '8px',
    marginBottom: '8px',
    '& div': {
      borderRadius: '0px',
    },
    '& input[type=search]::-webkit-search-cancel-button': { display: 'none' },
  },
  startAdornment: {
    width: '20px',
    color: OpossumColors.grey,
  },
  endAdornment: {
    width: '20px',
    color: OpossumColors.grey,
    '&:hover': {
      color: OpossumColors.darkBlue,
      cursor: 'pointer',
    },
  },
};

interface SearchTextFieldProps {
  onInputChange(search: string): void;
  search: string;
  autoFocus?: boolean;
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
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <ClearIcon
              onClick={(): void => props.onInputChange('')}
              sx={classes.endAdornment}
            />
          </InputAdornment>
        ),
      }}
    />
  );
}
