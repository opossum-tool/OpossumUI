// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { InputAdornment } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MuiTextField from '@material-ui/core/TextField';
import { Search } from '@material-ui/icons';
import React, { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';

const useStyles = makeStyles({
  searchField: {
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
      margin="dense"
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
