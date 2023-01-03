// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiBox from '@mui/material/Box';
import MuiList from '@mui/material/List';
import MuiListItem from '@mui/material/ListItem';
import MuiListItemText from '@mui/material/ListItemText';
import MuiListItemButton from '@mui/material/ListItemButton';
import { OpossumColors } from '../../shared-styles';
import { getAttributesWithHighlighting } from './list-with-attributes-helpers';
import { ListWithAttributesItem } from '../../types/types';

const LIST_WITH_ATTRIBUTES_VERTICAL_BORDER_AND_MARGIN = 10; // 10px = margin + border

const classes = {
  listBox: {
    width: 'fit-content',
    maxHeight: '100%',
    background: OpossumColors.lightBlue,
  },
  list: {
    padding: '0px',
    width: 'fit-content',
    backgroundColor: OpossumColors.white,
    border: `1px ${OpossumColors.grey} solid`,
    maxHeight: `calc(100% - ${LIST_WITH_ATTRIBUTES_VERTICAL_BORDER_AND_MARGIN}px)`,
    overflowY: 'auto',
    margin: '4px',
  },
  listItem: {
    padding: '0px',
    borderBottom: 2,
    borderColor: OpossumColors.lightBlue,
  },
  listItemButton: {
    padding: '0px 0px 0px 4px',
    '&:hover': {
      backgroundColor: OpossumColors.lightestBlueOnHover,
    },
    '&.Mui-selected': {
      '&:hover': {
        backgroundColor: OpossumColors.middleBlueOnHover,
      },
      backgroundColor: OpossumColors.middleBlue,
    },
  },
  listItemTextAttributesBox: {
    display: 'flex',
    // TODO: Now: Single scroll bar for each list item.
    // Remove 'overflowX' property to get single scroll bar
    // for the whole list (also if only a single
    // list item exceeds maxWidth)
    overflowX: 'auto',
    maxWidth: '50vw',
    marginLeft: '20px',
    paddingTop: '1px',
  },
};

interface ListWithAttributesProps {
  listItems: Array<ListWithAttributesItem>;
  selectedListItemId: string;
  highlightedAttributeIds: Array<string>;
  handleListItemClick: (id: string) => void;
  showAddNewInput: boolean; // TODO: required later
}

export function ListWithAttributes(
  props: ListWithAttributesProps
): ReactElement {
  return (
    <MuiBox sx={classes.listBox}>
      <MuiList sx={classes.list}>
        {props.listItems.map((item) => (
          <MuiListItem key={`itemId-${item.id}`} sx={classes.listItem}>
            <MuiListItemButton
              sx={classes.listItemButton}
              selected={item.id === props.selectedListItemId}
              onClick={(): void => props.handleListItemClick(item.id)}
            >
              <MuiListItemText
                primary={item.text}
                secondary={
                  <MuiBox sx={classes.listItemTextAttributesBox}>
                    {getAttributesWithHighlighting(
                      item.attributes,
                      props.highlightedAttributeIds
                    )}
                  </MuiBox>
                }
                secondaryTypographyProps={{ component: 'span' }}
              />
            </MuiListItemButton>
          </MuiListItem>
        ))}
      </MuiList>
    </MuiBox>
  );
}
