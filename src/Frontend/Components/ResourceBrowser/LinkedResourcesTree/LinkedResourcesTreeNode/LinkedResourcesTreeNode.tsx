// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { treeItemClasses } from '../../../../shared-styles';
import { BreakpointIcon, DirectoryIcon, FileIcon } from '../../../Icons/Icons';
import { TreeNode } from '../../../VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode';

const labelDetail = 'without information';

export const LinkedResourcesTreeNode: React.FC<TreeNode> = ({ resource }) => {
  const isAttributionBreakpoint = resource.isAttributionBreakpoint;
  const showFolderIcon = !resource.isFile;
  const labelText = resource.labelText;

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
};
