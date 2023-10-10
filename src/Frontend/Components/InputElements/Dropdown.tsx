// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import { inputElementClasses, InputElementProps } from './shared';
import MuiTextField from '@mui/material/TextField';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

interface DropdownProps extends InputElementProps {
  value: string;
  menuItems: Array<menuItem>;
}

export interface menuItem {
  value: string;
  name: string;
}

export function Dropdown(props: DropdownProps): ReactElement {
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
    <MuiBox sx={props.sx}>
      <MuiTextField
        disabled={!props.isEditable}
        sx={{
          ...inputElementClasses.textField,
          ...(props.isHighlighted
            ? inputElementClasses.defaultHighlightedTextField
            : {}),
        }}
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
              <MuiTypography>{menuItem.name}</MuiTypography>
            </MuiMenuItem>
          );
        })}
      </MuiTextField>
    </MuiBox>
  );
}
