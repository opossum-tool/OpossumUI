// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { InputAdornment } from '@mui/material';
import MuiTextField from '@mui/material/TextField';
import { Search } from '@mui/icons-material';
import React, { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';

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
}

export function SearchTextField(props: SearchTextFieldProps): ReactElement {
  return (
    <MuiTextField
      label="Search"
      type="search"
      variant="outlined"
      autoFocus={props.autoFocus ?? false}
      size="small"
      sx={classes.searchField}
      value={props.search}
      fullWidth={true}
      onChange={(event): void => props.onInputChange(event.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Search sx={classes.endAdornment} />
          </InputAdornment>
        ),
      }}
    />
  );
}
