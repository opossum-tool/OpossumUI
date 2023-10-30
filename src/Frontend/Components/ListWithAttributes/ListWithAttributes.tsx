// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddBoxIcon from '@mui/icons-material/AddBox';
import MuiBox from '@mui/material/Box';
import MuiList from '@mui/material/List';
import MuiTypography from '@mui/material/Typography';
import { SxProps } from '@mui/system';
import { ChangeEvent, ReactElement, useState } from 'react';

import {
  clickableIcon,
  disabledIcon,
  OpossumColors,
} from '../../shared-styles';
import { ListWithAttributesItem } from '../../types/types';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';
import { IconButton } from '../IconButton/IconButton';
import { TextBox } from '../InputElements/TextBox';
import { ListWithAttributesListItem } from '../ListWithAttributesListItem/ListWithAttributesListItem';

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
};

interface ListWithAttributesProps {
  listItems: Array<ListWithAttributesItem>;
  selectedListItemId: string;
  highlightedAttributeIds?: Array<string>;
  handleListItemClick(id: string): void;
  showChipsForAttributes: boolean;
  showAddNewListItem?: boolean;
  setManuallyAddedListItems?(items: string): void;
  title?: string;
  listSx?: SxProps;
  emptyTextFallback?: string;
  sortList?(
    items: Array<ListWithAttributesItem>,
    highlightedAttributeIds?: Array<string>,
  ): Array<ListWithAttributesItem>;
}

export function ListWithAttributes(
  props: ListWithAttributesProps,
): ReactElement {
  const [textBoxInput, setTextBoxInput] = useState<string>('');

  function handleTextBoxInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    setTextBoxInput(event.target.value);
  }

  function handleAddNewInputClick(): void {
    if (props.setManuallyAddedListItems) {
      props.setManuallyAddedListItems(textBoxInput);
    }
    setTextBoxInput('');
  }

  const textInputIsInvalid = !textBoxInput || !textBoxInput.trim().length;

  const listItemsToDisplay = props.sortList
    ? props.sortList(props.listItems, props.highlightedAttributeIds)
    : props.listItems;

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
        {listItemsToDisplay.map((item, index) => (
          <ListWithAttributesListItem
            item={item}
            highlightedAttributeIds={props.highlightedAttributeIds}
            key={`itemId-${item.id}`}
            handleListItemClick={props.handleListItemClick}
            isSelected={item.id === props.selectedListItemId}
            showChipsForAttributes={props.showChipsForAttributes}
            isFirstItem={index === 0}
            isLastItem={index === listItemsToDisplay.length - 1}
            listContainsSingleItem={listItemsToDisplay.length === 1}
            emptyTextFallback={props.emptyTextFallback}
          />
        ))}
      </MuiList>
      {props.showAddNewListItem && (
        <TextBox
          title={'Add new item'}
          isEditable={true}
          handleChange={handleTextBoxInputChange}
          text={textBoxInput}
          endIcon={
            <IconButton
              icon={
                <AddBoxIcon
                  sx={textInputIsInvalid ? disabledIcon : clickableIcon}
                />
              }
              onClick={handleAddNewInputClick}
              disabled={textInputIsInvalid}
              tooltipTitle={
                textInputIsInvalid
                  ? 'Enter text to add a new item to the list'
                  : 'Click to add a new item to the list'
              }
              tooltipPlacement={'right'}
            />
          }
        />
      )}
    </MuiBox>
  );
}
