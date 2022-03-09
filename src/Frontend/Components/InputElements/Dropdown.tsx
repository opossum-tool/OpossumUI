// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { InputElementProps, useInputElementStyles } from './shared';
import MuiTextField from '@mui/material/TextField';
import MuiMenuItem from '@mui/material/MenuItem';
import clsx from 'clsx';

interface DropdownProps extends InputElementProps {
  value: number;
  menuItems: Array<menuItem>;
}

interface menuItem {
  value: number;
  name: string;
}

export function Dropdown(props: DropdownProps): ReactElement {
  const classes = useInputElementStyles();
  const menuItems = getMenuItemsWithSelectedValueIncluded();

  function getMenuItemsWithSelectedValueIncluded(): Array<menuItem> {
    const availableValues = props.menuItems.map((menuItem) => menuItem.value);

    return props.value && !availableValues.includes(props.value)
      ? props.menuItems.concat([
          {
            value: props.value,
            name: `${props.value}`,
          },
        ])
      : props.menuItems;
  }

  return (
    <div className={props.className}>
      <MuiTextField
        disabled={!props.isEditable}
        className={clsx(
          classes.textField,
          props.isHighlighted && classes.highlightedTextField
        )}
        select
        label={props.title}
        InputProps={{
          inputProps: {
            'aria-label': props.title,
          },
        }}
        id={`dropdown ${props.title}`}
        value={props.value}
        onChange={props.handleChange}
        variant="outlined"
        size="small"
      >
        {menuItems.map((menuItem) => {
          return (
            <MuiMenuItem value={menuItem.value} key={menuItem.name}>
              {menuItem.name}
            </MuiMenuItem>
          );
        })}
      </MuiTextField>
    </div>
  );
}
