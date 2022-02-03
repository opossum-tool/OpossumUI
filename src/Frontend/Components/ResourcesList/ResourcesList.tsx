// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { List } from '../List/List';
import { ListCard } from '../ListCard/ListCard';
import { doNothing } from '../../util/do-nothing';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';
import { OpossumColors } from '../../shared-styles';
import { convertResourcesListBatchesToResourcesListItems } from './resource-list-helpers';
import { ResourcesListBatch } from '../../types/types';
import { getFilesWithChildren } from '../../state/selectors/all-views-resource-selectors';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';

const useStyles = makeStyles({
  root: {
    marginTop: 6,
    backgroundColor: OpossumColors.white,
  },
});

interface ResourcesListProps {
  resourcesListBatches: Array<ResourcesListBatch>;
  maxHeight?: number;
  onClickCallback?: () => void;
}

export interface ResourcesListItem {
  text: string;
  isHeader?: boolean;
}

export function ResourcesList(props: ResourcesListProps): ReactElement {
  const classes = useStyles();
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);
  const dispatch = useAppDispatch();
  const onClickCallback = props.onClickCallback ?? doNothing;

  const resourcesListItems: Array<ResourcesListItem> =
    convertResourcesListBatchesToResourcesListItems(props.resourcesListBatches);

  function getResourceCard(index: number): ReactElement {
    const cardText: string = resourcesListItems[index].text;
    const isHeader = resourcesListItems[index].isHeader;

    const formattedText = isHeader
      ? cardText
      : removeTrailingSlashIfFileWithChildren(cardText, isFileWithChildren);

    function onPathClick(): void {
      dispatch(navigateToSelectedPathOrOpenUnsavedPopup(cardText));
      onClickCallback();
    }

    return (
      <ListCard
        text={formattedText}
        onClick={isHeader ? doNothing : onPathClick}
        cardConfig={isHeader ? { isHeader: true } : { isResource: true }}
      />
    );
  }

  const max = props.maxHeight
    ? { height: props.maxHeight }
    : { numberOfDisplayedItems: 30 };

  return (
    <div className={classes.root}>
      <List
        getListItem={getResourceCard}
        max={max}
        length={resourcesListItems.length}
        addPaddingBottom={true}
        allowHorizontalScrolling={true}
      />
    </div>
  );
}
