// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import { OpossumColors } from '../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getFilesWithChildren } from '../../state/selectors/all-views-resource-selectors';
import { ResourcesListBatch } from '../../types/types';
import { doNothing } from '../../util/do-nothing';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';
import { List } from '../List/List';
import { ListCard } from '../ListCard/ListCard';
import { convertResourcesListBatchesToResourcesListItems } from './ResourcesList.util';

const classes = {
  root: {
    marginTop: '6px',
    backgroundColor: OpossumColors.white,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
};

interface ResourcesListProps {
  resourcesListBatches: Array<ResourcesListBatch>;
  onClickCallback?: () => void;
}

export interface ResourcesListItem {
  text: string;
}

export function ResourcesList(props: ResourcesListProps): ReactElement {
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);
  const dispatch = useAppDispatch();
  const onClickCallback = props.onClickCallback ?? doNothing;

  const resourcesListItems: Array<ResourcesListItem> =
    convertResourcesListBatchesToResourcesListItems(props.resourcesListBatches);

  function getResourceCard(index: number): ReactElement {
    const cardText = resourcesListItems[index].text;

    const formattedText = removeTrailingSlashIfFileWithChildren(
      cardText,
      isFileWithChildren,
    );

    function onPathClick(): void {
      dispatch(navigateToSelectedPathOrOpenUnsavedPopup(cardText));
      onClickCallback();
    }

    return (
      <ListCard
        text={formattedText}
        onClick={onPathClick}
        cardConfig={{ isResource: true }}
      />
    );
  }

  return (
    <MuiBox sx={classes.root}>
      <List
        getListItem={getResourceCard}
        length={resourcesListItems.length}
        cardHeight={24}
        fullHeight
      />
    </MuiBox>
  );
}
