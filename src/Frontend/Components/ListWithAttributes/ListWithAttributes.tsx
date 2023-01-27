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
import MuiTypography from '@mui/material/Typography';
import { OpossumColors } from '../../shared-styles';
import { getAttributesWithHighlighting } from './list-with-attributes-helpers';
import { ListWithAttributesItem } from '../../types/types';
import { SxProps } from '@mui/system';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

const LIST_TITLE_HEIGHT = 36;

const classes = {
  titleAndListBox: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '15px',
  },
  title: {
    backgroundColor: OpossumColors.white,
    paddingLeft: '9px',
    paddingBottom: '8px',
    height: `${LIST_TITLE_HEIGHT}px - 8px`,
  },
  list: {
    padding: '0px',
    width: '250px',
    backgroundColor: OpossumColors.white,
    maxHeight: `calc(100% - ${LIST_TITLE_HEIGHT}px)`,
    overflowY: 'auto',
  },
  listItem: {
    padding: '0px',
    backgroundColor: OpossumColors.white,
  },
  listItemButton: {
    overflowX: 'auto',
    margin: '0px 8px',
    border: 'solid',
    borderWidth: '1px 2px 1px 2px',
    borderColor: OpossumColors.lightestBlue,
    padding: '0px 0px 0px 4px',
    '&:hover': {
      backgroundColor: OpossumColors.lightestBlueOnHover,
      borderColor: OpossumColors.lightestBlueOnHover,
    },
    '&.Mui-selected': {
      backgroundColor: OpossumColors.middleBlue,
      borderColor: OpossumColors.middleBlue,
      '&:hover': {
        backgroundColor: OpossumColors.middleBlueOnHover,
        borderColor: OpossumColors.middleBlueOnHover,
      },
    },
  },
  firstListItemButton: {
    borderWidth: '2px 2px 1px 2px',
  },
  lastListItemButton: {
    marginBottom: '8px',
    borderWidth: '1px 2px 2px 2px',
  },
  onlySingleListItemButton: {
    marginBottom: '8px',
    borderWidth: '2px',
  },
  listItemTextAttributesBox: {
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: '24px',
    paddingTop: '1px',
  },
};

interface ListWithAttributesProps {
  listItems: Array<ListWithAttributesItem>;
  selectedListItemId: string;
  highlightedAttributeIds?: Array<string>;
  handleListItemClick: (id: string) => void;
  showChipsForAttributes: boolean;
  showAddNewInput: boolean;
  title?: string;
  listSx?: SxProps;
  emptyTextFallback?: string;
}

export function ListWithAttributes(
  props: ListWithAttributesProps
): ReactElement {
  return (
    <MuiBox sx={classes.titleAndListBox}>
      <MuiTypography sx={classes.title} variant={'subtitle1'}>
        {props.title}
      </MuiTypography>
      <MuiList
        sx={getSxFromPropsAndClasses({
          sxProps: props.listSx,
          styleClass: classes.list,
        })}
      >
        {props.listItems.map((item, index) => (
          <MuiListItem key={`itemId-${item.id}`} sx={classes.listItem}>
            <MuiListItemButton
              sx={
                props.listItems.length === 1
                  ? {
                      ...classes.listItemButton,
                      ...classes.onlySingleListItemButton,
                    }
                  : index === 0
                  ? {
                      ...classes.listItemButton,
                      ...classes.firstListItemButton,
                    }
                  : index === props.listItems.length - 1
                  ? { ...classes.listItemButton, ...classes.lastListItemButton }
                  : classes.listItemButton
              }
              selected={item.id === props.selectedListItemId}
              onClick={(): void => props.handleListItemClick(item.id)}
            >
              <MuiListItemText
                primary={item.text || (props.emptyTextFallback ?? '-')}
                secondary={
                  <MuiBox sx={classes.listItemTextAttributesBox}>
                    {getAttributesWithHighlighting(
                      item.attributes,
                      props.showChipsForAttributes,
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
