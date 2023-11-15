// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import MuiListItem from '@mui/material/ListItem';
import MuiListItemButton from '@mui/material/ListItemButton';
import MuiListItemText from '@mui/material/ListItemText';
import { SxProps } from '@mui/system/styleFunctionSx';
import { Fragment, ReactElement } from 'react';

import { baseIcon, OpossumColors } from '../../shared-styles';
import { ListWithAttributesItem } from '../../types/types';
import { ManuallyAddedListItemIcon } from '../Icons/Icons';

const classes = {
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
  listItemTextPrimaryBox: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  manuallyAddedListItemIcon: {
    ...baseIcon,
    color: OpossumColors.darkBlue,
    marginLeft: 'auto',
  },
  listItemTextSecondaryBox: {
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: '24px',
    paddingTop: '1px',
  },
  primaryTypography: {
    margin: '13px 5px 13px 0px',
  },
  secondaryTypography: {
    component: 'span',
  },
  styleChips: {
    cursor: 'pointer',
    backgroundColor: OpossumColors.lightGrey,
    padding: '0px 8px',
    margin: '5px 5px 0px 0px',
    height: '22px',
    '.MuiChip-label': {
      padding: '0px',
      color: OpossumColors.black,
    },
  },
  styleChipsHighlighted: {
    backgroundColor: OpossumColors.mediumGrey,
  },
};

const ITEM_TEXT_FALLBACK = '-';

interface ListWithAttributesItemProps {
  item: ListWithAttributesItem;
  isSelected: boolean;
  highlightedAttributeIds?: Array<string>;
  handleListItemClick: (id: string) => void;
  showChipsForAttributes: boolean;
  emptyTextFallback?: string;
  isFirstItem: boolean;
  isLastItem: boolean;
  listContainsSingleItem: boolean;
}

export function ListWithAttributesListItem(
  props: ListWithAttributesItemProps,
): ReactElement {
  const listItemButtonStyle = props.listContainsSingleItem
    ? {
        ...classes.listItemButton,
        ...classes.onlySingleListItemButton,
      }
    : props.isFirstItem
      ? {
          ...classes.listItemButton,
          ...classes.firstListItemButton,
        }
      : props.isLastItem
        ? { ...classes.listItemButton, ...classes.lastListItemButton }
        : classes.listItemButton;

  const text =
    props.item.text || (props.emptyTextFallback ?? ITEM_TEXT_FALLBACK);

  return (
    <MuiListItem sx={classes.listItem}>
      <MuiListItemButton
        sx={listItemButtonStyle}
        selected={props.isSelected}
        onClick={(): void => props.handleListItemClick(props.item.id)}
      >
        <MuiListItemText
          primary={
            <MuiBox sx={classes.listItemTextPrimaryBox}>
              {text}
              {Boolean(props.item.manuallyAdded) && (
                <ManuallyAddedListItemIcon
                  sx={classes.manuallyAddedListItemIcon}
                />
              )}
            </MuiBox>
          }
          secondary={
            props.item.attributes && !props.item.manuallyAdded ? (
              <MuiBox sx={classes.listItemTextSecondaryBox}>
                {props.item.attributes.map((attribute) => (
                  <Fragment key={`attributeId-${attribute.id}`}>
                    {props.showChipsForAttributes ? (
                      <MuiChip
                        clickable={false}
                        label={attribute.text || ITEM_TEXT_FALLBACK}
                        variant={'filled'}
                        size={'small'}
                        sx={getChipStyling(
                          props.highlightedAttributeIds,
                          attribute.id,
                        )}
                      />
                    ) : (
                      attribute.text || ITEM_TEXT_FALLBACK
                    )}
                  </Fragment>
                ))}
              </MuiBox>
            ) : null
          }
          primaryTypographyProps={{
            sx: Boolean(props.item.manuallyAdded)
              ? classes.primaryTypography
              : undefined,
          }}
          secondaryTypographyProps={{ component: 'span' }}
        />
      </MuiListItemButton>
    </MuiListItem>
  );
}

function getChipStyling(
  highlightedAttributeIds?: Array<string>,
  attributeId?: string,
): SxProps {
  const highlightedSx =
    attributeId !== undefined
      ? highlightedAttributeIds?.includes(attributeId)
        ? classes.styleChipsHighlighted
        : {}
      : {};

  return { ...classes.styleChips, ...highlightedSx };
}
