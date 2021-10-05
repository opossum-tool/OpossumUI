// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { List } from '../List/List';
import { ListCard } from '../ListCard/ListCard';
import { doNothing } from '../../util/do-nothing';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';
import { getIsFileWithChildren } from '../../state/selectors/all-views-resource-selectors';
import { OpossumColors } from '../../shared-styles';

const useStyles = makeStyles({
  root: {
    marginTop: 6,
    backgroundColor: OpossumColors.white,
  },
});

interface ResourcesListProps {
  resourceIds: Array<string>;
  maxHeight?: number;
  onClickCallback?: () => void;
}

export function ResourcesList(props: ResourcesListProps): ReactElement {
  const classes = useStyles();

  const isFileWithChildren = useSelector(getIsFileWithChildren);
  const dispatch = useDispatch();
  const sortedResourcePaths = props.resourceIds.sort();
  const onClickCallback = props.onClickCallback ?? doNothing;

  function getResourceCard(index: number): ReactElement {
    const resourcePath: string = sortedResourcePaths[index];

    function onPathClick(): void {
      dispatch(navigateToSelectedPathOrOpenUnsavedPopup(resourcePath));
      onClickCallback();
    }

    return (
      <ListCard
        text={removeTrailingSlashIfFileWithChildren(
          resourcePath,
          isFileWithChildren
        )}
        onClick={onPathClick}
        cardConfig={{ isResource: true }}
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
        length={sortedResourcePaths.length}
        addPaddingBottom={true}
        allowHorizontalScrolling={true}
      />
    </div>
  );
}
