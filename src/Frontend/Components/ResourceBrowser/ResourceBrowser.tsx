// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import remove from 'lodash/remove';
import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { topBarOffset, useWindowHeight } from '../../util/use-window-height';
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
    flex: 1,
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

  const resources = useSelector(getResources);
  const selectedResourceId = useSelector(getSelectedResourceId);
  const expandedIds = useSelector(getExpandedIds);

  const manualAttributions = useSelector(getManualAttributions);
  const resourcesToManualAttributions = useSelector(
    getResourcesToManualAttributions
  );
  const resourcesWithManualAttributedChildren = useSelector(
    getResourcesWithManualAttributedChildren
  );

  const externalAttributions = useSelector(getExternalAttributions);
  const resourcesToExternalAttributions = useSelector(
    getResourcesToExternalAttributions
  );
  const resourcesWithExternalAttributedChildren = useSelector(
    getResourcesWithExternalAttributedChildren
  );
  const resolvedExternalAttributions = useSelector(
    getResolvedExternalAttributions
  );

  const attributionBreakpoints = useSelector(getAttributionBreakpoints);
  const filesWithChildren = useSelector(getFilesWithChildren);

  const dispatch = useDispatch();

  const treeHeight: number = useWindowHeight() - topBarOffset;

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
