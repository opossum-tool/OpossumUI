// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { InputAdornment } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import MuiTextField from '@mui/material/TextField';
import { Search } from '@mui/icons-material';
import React, { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';

const useStyles = makeStyles({
  searchField: {
    marginTop: 4,
    marginBottom: 8,
    '& div': {
      borderRadius: 0,
    },
  },
  endAdornment: {
    width: 20,
    color: OpossumColors.grey,
  },
});

interface SearchTextFieldProps {
  onInputChange(search: string): void;
  search: string;
  autoFocus?: boolean;
}

export function SearchTextField(props: SearchTextFieldProps): ReactElement {
  const classes = useStyles();

  return (
    <MuiTextField
      label="Search"
      type="search"
      variant="outlined"
      autoFocus={props.autoFocus ?? false}
      size="small"
      className={classes.searchField}
      value={props.search}
      fullWidth={true}
      onChange={(event): void => props.onInputChange(event.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Search className={classes.endAdornment} />
          </InputAdornment>
        ),
      }}
    />
  );
}
