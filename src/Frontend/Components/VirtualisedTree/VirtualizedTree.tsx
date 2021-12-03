// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { renderTree } from './renderTree';
import { List } from '../List/List';
import { useWindowHeight } from '../../util/use-window-height';
import {
  OpossumColors,
  resourceBrowserWidthInPixels,
} from '../../shared-styles';
import { topBarHeight } from '../TopBar/TopBar';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { PathPredicate } from '../../types/types';

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

interface VirtualizedTreeProps {
  resources: Resources | null;
  manualAttributions: Attributions;
  resourcesToManualAttributions: ResourcesToAttributions;
  externalAttributions: Attributions;
  resourcesToExternalAttributions: ResourcesToAttributions;
  resourcesWithExternalAttributedChildren: ResourcesWithAttributedChildren;
  resourcesWithManualAttributedChildren: ResourcesWithAttributedChildren;
  resolvedExternalAttributions: Set<string>;
  expandedIds: Array<string>;
  selectedResourceId: string;
  isAttributionBreakpoint: PathPredicate;
  isFileWithChildren: PathPredicate;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps
): ReactElement | null {
  const classes = useStyles();

  const treeHeight: number = useWindowHeight() - topBarHeight - 4;

  const treeItems: Array<ReactElement> = props.resources
    ? renderTree(
        { '': props.resources },
        '',
        props.manualAttributions,
        props.resourcesToManualAttributions,
        props.externalAttributions,
        props.resourcesToExternalAttributions,
        props.resourcesWithExternalAttributedChildren,
        props.resourcesWithManualAttributedChildren,
        props.resolvedExternalAttributions,
        classes,
        props.expandedIds,
        props.selectedResourceId,
        props.isAttributionBreakpoint,
        props.isFileWithChildren,
        props.onSelect,
        props.onToggle
      )
    : [];

  return props.resources ? (
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
