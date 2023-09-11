// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { List } from './List';
import {
  HeightForTree,
  NodeIdPredicateForTree,
  NodesForTree,
  NumberOfDisplayedNodesForTree,
  TreeNodeStyle,
} from './types';
import { min } from 'lodash';
import {
  VirtualizedTreeNode,
  VirtualizedTreeNodeData,
} from './VirtualizedTreeNode';
import { getTreeNodeProps } from './utils/get-tree-node-props';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { IconButton } from '../../Components/IconButton/IconButton';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { OpossumColors } from '../../shared-styles';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getLocatePopupSelectedCriticality,
  getLocatePopupSelectedLicenses,
} from '../../state/selectors/locate-popup-selectors';
import { initialResourceState } from '../../state/reducers/resource-reducer';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { PopupType } from '../../enums/enums';

const classes = {
  content: {
    height: '100%',
  },
  filterIcon: {
    margin: '4px',
    padding: '2px',
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    color: OpossumColors.darkBlue,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
};

const DEFAULT_MAX_TREE_DISPLAYED_NODES = 5;

interface VirtualizedTreeProps {
  nodes: NodesForTree;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string,
  ) => ReactElement;
  expandedIds: Array<string>;
  selectedNodeId: string;
  isFakeNonExpandableNode: NodeIdPredicateForTree;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  ariaLabel?: string;
  cardHeight: number;
  maxHeight?: number;
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
  sx?: SxProps;
  treeNodeStyle?: TreeNodeStyle;
  alwaysShowHorizontalScrollBar?: boolean;
  breakpoints?: Set<string>;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps,
): ReactElement | null {
  const dispatch = useAppDispatch();

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const treeNodeProps: Array<VirtualizedTreeNodeData> = getTreeNodeProps(
    props.nodes,
    '',
    props.expandedIds,
    props.selectedNodeId,
    props.isFakeNonExpandableNode,
    props.onSelect,
    props.onToggle,
    props.getTreeNodeLabel,
    props.cardHeight,
    props.breakpoints,
  );

  const maxListLength: NumberOfDisplayedNodesForTree | HeightForTree =
    props.maxHeight
      ? { height: props.maxHeight }
      : {
          numberOfDisplayedNodes: min([
            treeNodeProps.length,
            DEFAULT_MAX_TREE_DISPLAYED_NODES,
          ]) as number,
        };

  const indexToScrollTo = treeNodeProps.findIndex(
    (itemData) => itemData.nodeId === props.selectedNodeId,
  );

  const locatePopupSelectedCriticality = useAppSelector(
    getLocatePopupSelectedCriticality,
  );
  const locatePopupSelectedLicenses = useAppSelector(
    getLocatePopupSelectedLicenses,
  );
  const showFilterIcon =
    locatePopupSelectedCriticality !==
      initialResourceState.locatePopup.selectedCriticality ||
    locatePopupSelectedLicenses.size > 0;

  return props.nodes ? (
    <MuiBox aria-label={props.ariaLabel} sx={props.sx}>
      {showFilterIcon ? (
        <IconButton
          sx={classes.filterIcon}
          // TODO figure out how to place the tooltip correctly
          tooltipTitle=""
          tooltipPlacement="right"
          onClick={(): void => {
            dispatch(openPopup(PopupType.LocatorPopup));
          }}
          icon={<MyLocationIcon aria-label={'filter attributions'} />}
        />
      ) : null}
      <MuiBox sx={classes.content}>
        <List
          length={treeNodeProps.length}
          max={maxListLength}
          cardVerticalDistance={props.cardHeight}
          getListItem={(index: number): ReactElement => (
            <VirtualizedTreeNode
              {...{
                ...treeNodeProps[index],
                expandedNodeIcon: props.expandedNodeIcon,
                nonExpandedNodeIcon: props.nonExpandedNodeIcon,
                treeNodeStyle: props.treeNodeStyle,
              }}
            />
          )}
          alwaysShowHorizontalScrollBar={props.alwaysShowHorizontalScrollBar}
          indexToScrollTo={indexToScrollTo}
        />
      </MuiBox>
    </MuiBox>
  ) : null;
}
