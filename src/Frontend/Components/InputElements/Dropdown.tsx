// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiTextField from '@mui/material/TextField';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { StyledPopupIndicator } from './Dropdown.style';
import { inputElementClasses, InputElementProps } from './shared';

interface DropdownProps extends InputElementProps {
  value: string;
  menuItems: Array<MenuItem>;
}

export interface MenuItem {
  value: string;
  name: string;
}

export function Dropdown(props: DropdownProps): ReactElement {
  const menuItems = getMenuItemsWithSelectedValueIncluded();

  function getMenuItemsWithSelectedValueIncluded(): Array<MenuItem> {
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
        disabled={props.disabled}
        color={props.color}
        focused={props.focused}
        sx={{
          ...inputElementClasses.textField,
          ...(props.isHighlighted
            ? inputElementClasses.defaultHighlightedTextField
            : {}),
        }}
        select
        SelectProps={{ IconComponent: StyledPopupIndicator }}
        label={props.title}
        InputProps={{
          inputProps: {
            'aria-label': props.title,
          },
          readOnly: props.readOnly,
        }}
        id={`dropdown ${props.title}`}
        value={props.value}
        onChange={props.handleChange}
        variant="outlined"
        size="small"
      >
        {menuItems.map((menuItem) => (
          <MuiMenuItem value={menuItem.value} key={menuItem.name}>
            <MuiTypography sx={{ lineHeight: 1.3, paddingTop: '2px' }}>
              {menuItem.name}
            </MuiTypography>
          </MuiMenuItem>
        ))}
      </MuiTextField>
    </MuiBox>
  );
}
