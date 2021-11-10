// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import remove from 'lodash/remove';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalAttributions,
  getFilesWithChildren,
  getManualAttributions,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithManualAttributedChildren,
} from '../../state/selectors/all-views-resource-selectors';
import { renderTree } from './renderTree';
import { List } from '../List/List';
import { useWindowHeight } from '../../util/use-window-height';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setExpandedIds } from '../../state/actions/resource-actions/audit-view-simple-actions';
import {
  getExpandedIds,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import {
  OpossumColors,
  resourceBrowserWidthInPixels,
} from '../../shared-styles';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { topBarHeight } from '../TopBar/TopBar';

const useStyles = makeStyles({
  root: {
    width: resourceBrowserWidthInPixels,
    padding: '4px 0',
    background: OpossumColors.white,
    height: '100%',
  },
  content: {
    height: '100%',
  },
  treeItemLabel: {
    height: 19,
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover}`,
      cursor: 'pointer',
    },
  },
  treeItemLabelChildrenOfSelected: {
    backgroundColor: `${OpossumColors.lightestBlue}`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
  },
  treeItemLabelSelected: {
    backgroundColor: `${OpossumColors.lightestBlue} !important`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover} !important`,
    },
  },
  treeItemSpacer: {
    flexShrink: 0,
  },
  listItem: {
    display: 'flex',
  },
});

export function ResourceBrowser(): ReactElement | null {
  const classes = useStyles();

  const resources = useAppSelector(getResources);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);

  const manualAttributions = useAppSelector(getManualAttributions);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions
  );
  const resourcesWithManualAttributedChildren = useAppSelector(
    getResourcesWithManualAttributedChildren
  );

  const externalAttributions = useAppSelector(getExternalAttributions);
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions
  );
  const resourcesWithExternalAttributedChildren = useAppSelector(
    getResourcesWithExternalAttributedChildren
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions
  );

  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  const dispatch = useAppDispatch();

  const treeHeight: number = useWindowHeight() - topBarHeight - 4;

  function handleToggle(nodeIdsToExpand: Array<string>): void {
    let newExpandedNodeIds = [...expandedIds];
    if (expandedIds.includes(nodeIdsToExpand[0])) {
      remove(newExpandedNodeIds, (nodeId: string): boolean =>
        nodeId.startsWith(nodeIdsToExpand[0])
      );
    } else {
      newExpandedNodeIds = newExpandedNodeIds.concat(nodeIdsToExpand);
    }
    dispatch(setExpandedIds(newExpandedNodeIds));
  }

  function handleSelect(
    event: React.ChangeEvent<unknown>,
    nodeId: string
  ): void {
    dispatch(setSelectedResourceIdOrOpenUnsavedPopup(nodeId));
  }

  const treeItems: Array<ReactElement> = resources
    ? renderTree(
        { '': resources },
        '',
        manualAttributions,
        resourcesToManualAttributions,
        externalAttributions,
        resourcesToExternalAttributions,
        resourcesWithExternalAttributedChildren,
        resourcesWithManualAttributedChildren,
        resolvedExternalAttributions,
        classes,
        expandedIds,
        selectedResourceId,
        getAttributionBreakpointCheck(attributionBreakpoints),
        getFileWithChildrenCheck(filesWithChildren),
        handleSelect,
        handleToggle
      )
    : [];

  return resources ? (
    <div aria-label={'resource browser'} className={classes.root}>
      <div className={classes.content}>
        <List
          length={treeItems.length}
          max={{ height: treeHeight }}
          cardVerticalDistance={20}
          getListItem={(index: number): ReactElement => treeItems[index]}
          alwaysShowHorizontalScrollBar={true}
        />
      </div>
    </div>
  ) : null;
}
