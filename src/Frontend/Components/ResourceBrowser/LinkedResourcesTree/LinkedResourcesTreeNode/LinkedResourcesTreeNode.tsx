// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { ROOT_PATH } from '../../../../shared-constants';
import { treeItemClasses } from '../../../../shared-styles';
import { useAppSelector } from '../../../../state/hooks';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
} from '../../../../state/selectors/resource-selectors';
import { BreakpointIcon, DirectoryIcon, FileIcon } from '../../../Icons/Icons';
import { TreeNode } from '../../../VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode';

const labelDetail = 'without information';

export function LinkedResourcesTreeNode({
  node,
  nodeId,
  nodeName,
}: TreeNode): ReactElement {
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  const isAttributionBreakpoint = attributionBreakpoints.has(nodeId);
  const showFolderIcon = node !== 1 && !filesWithChildren.has(nodeId);
  const labelText = nodeName || ROOT_PATH;

  return (
    <MuiBox sx={treeItemClasses.labelRoot}>
      {showFolderIcon ? (
        isAttributionBreakpoint ? (
          <BreakpointIcon />
        ) : (
          <DirectoryIcon
            sx={treeItemClasses.resourceWithoutInformation}
            labelDetail={labelDetail}
          />
        )
      ) : (
        <FileIcon
          sx={treeItemClasses.resourceWithoutInformation}
          labelDetail={labelDetail}
        />
      )}
      <MuiTypography
        sx={{
          ...treeItemClasses.text,
          ...(isAttributionBreakpoint && treeItemClasses.breakpoint),
        }}
      >
        {labelText}
      </MuiTypography>
    </MuiBox>
  );
}
