// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { treeItemClasses } from '../../shared-styles';
import { BreakpointIcon, DirectoryIcon, FileIcon } from '../Icons/Icons';

interface GeneralTreeItemLabelProps {
  labelText: string;
  canHaveChildren: boolean;
  isAttributionBreakpoint: boolean;
  showFolderIcon: boolean;
}

export function GeneralTreeItemLabel(
  props: GeneralTreeItemLabelProps,
): ReactElement {
  const iconSx = treeItemClasses.resourceWithoutInformation;
  const labelDetail = 'without information';

  return (
    <MuiBox sx={treeItemClasses.labelRoot}>
      {props.showFolderIcon ? (
        props.isAttributionBreakpoint ? (
          <BreakpointIcon />
        ) : (
          <DirectoryIcon sx={iconSx} labelDetail={labelDetail} />
        )
      ) : (
        <FileIcon sx={iconSx} labelDetail={labelDetail} />
      )}
      <MuiTypography
        sx={{
          ...treeItemClasses.text,
          ...(props.isAttributionBreakpoint ? treeItemClasses.breakpoint : {}),
        }}
      >
        {props.labelText}
      </MuiTypography>
    </MuiBox>
  );
}
