// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import WestRoundedIcon from '@mui/icons-material/WestRounded';
import remove from 'lodash/remove';
import { ReactElement } from 'react';

import { Resources } from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import { VirtualizedTree } from '../../extracted/VirtualisedTree/VirtualizedTree';
import {
  OpossumColors,
  TREE_ROOT_FOLDER_LABEL,
  TREE_ROW_HEIGHT,
  treeClasses,
} from '../../shared-styles';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setExpandedIds } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalData,
  getFilesWithChildren,
  getManualAttributions,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithLocatedAttributions,
  getResourcesWithManualAttributedChildren,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getExpandedIds,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { isLocateSignalActive } from '../../state/selectors/locate-popup-selectors';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { IconButton } from '../IconButton/IconButton';
import { LocateSignalsIcon } from '../Icons/Icons';
import { getResourceBrowserTreeItemLabel } from './get-resource-browser-tree-item-label';

const classes = {
  locatorIconContainer: {
    margin: '4px',
    position: 'absolute',
    top: 5,
    right: 15,
    zIndex: 1,
  },
  locatorIcon: {
    padding: '2px',
    color: OpossumColors.darkBlue,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
  locatedResourceIcon: {
    marginLeft: '10px',
    stroke: OpossumColors.darkBlue,
    fontSize: '20px',
  },
  tree: {
    background: OpossumColors.white,
    height: '100%',
    position: 'relative',
  },
};

export function ResourceBrowser(): ReactElement | null {
  const resources = useAppSelector(getResources);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);

  const manualAttributions = useAppSelector(getManualAttributions);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions,
  );
  const resourcesWithManualAttributedChildren = useAppSelector(
    getResourcesWithManualAttributedChildren,
  );

  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions,
  );
  const resourcesWithExternalAttributedChildren = useAppSelector(
    getResourcesWithExternalAttributedChildren,
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );

  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const externalData = useAppSelector(getExternalData);
  const dispatch = useAppDispatch();

  function handleToggle(nodeIdsToExpand: Array<string>): void {
    let newExpandedNodeIds = [...expandedIds];
    if (expandedIds.includes(nodeIdsToExpand[0])) {
      remove(newExpandedNodeIds, (nodeId: string): boolean =>
        nodeId.startsWith(nodeIdsToExpand[0]),
      );
    } else {
      newExpandedNodeIds = newExpandedNodeIds.concat(nodeIdsToExpand);
    }
    dispatch(setExpandedIds(newExpandedNodeIds));
  }

  function handleSelect(_: React.ChangeEvent<unknown>, nodeId: string): void {
    dispatch(setSelectedResourceIdOrOpenUnsavedPopup(nodeId));
  }

  function getTreeItemLabelGetter() {
    return (
      resourceName: string,
      resource: Resources | 1,
      nodeId: string,
    ): ReactElement =>
      getResourceBrowserTreeItemLabel(
        resourceName,
        resource,
        nodeId,
        resourcesToManualAttributions,
        resourcesToExternalAttributions,
        manualAttributions,
        resourcesWithExternalAttributedChildren,
        resourcesWithManualAttributedChildren,
        resolvedExternalAttributions,
        getAttributionBreakpointCheck(attributionBreakpoints),
        getFileWithChildrenCheck(filesWithChildren),
        externalData,
      );
  }

  const locateSignalActive = useAppSelector(isLocateSignalActive);
  const locatorIcon = locateSignalActive ? (
    <IconButton
      iconSx={classes.locatorIcon}
      containerSx={classes.locatorIconContainer}
      tooltipTitle="locate active"
      tooltipPlacement="right"
      onClick={(): void => {
        dispatch(openPopup(PopupType.LocatorPopup));
      }}
      icon={<LocateSignalsIcon />}
    />
  ) : undefined;
  const resourcesWithLocatedAttributions = useAppSelector(
    getResourcesWithLocatedAttributions,
  );

  const locatedResourceIcon = (
    <WestRoundedIcon
      sx={classes.locatedResourceIcon}
      aria-label={'located attribution'}
    />
  );

  return resources ? (
    <VirtualizedTree
      expandedIds={expandedIds}
      isFakeNonExpandableNode={getFileWithChildrenCheck(filesWithChildren)}
      onSelect={handleSelect}
      onToggle={handleToggle}
      nodes={{ [TREE_ROOT_FOLDER_LABEL]: resources }}
      selectedNodeId={selectedResourceId}
      getTreeNodeLabel={getTreeItemLabelGetter()}
      breakpoints={attributionBreakpoints}
      cardHeight={TREE_ROW_HEIGHT}
      sx={classes.tree}
      treeNodeStyle={{
        root: treeClasses.treeItemLabel,
        childrenOfSelected: treeClasses.treeItemLabelChildrenOfSelected,
        selected: treeClasses.treeItemLabelSelected,
        treeExpandIcon: treeClasses.treeExpandIcon,
      }}
      locatorIcon={locatorIcon}
      locatedResourceIcon={locatedResourceIcon}
      locatedResources={resourcesWithLocatedAttributions.locatedResources}
      resourcesWithLocatedChildren={
        resourcesWithLocatedAttributions.resourcesWithLocatedChildren
      }
      resizable
      width={300}
    />
  ) : null;
}
