// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import MuiTooltip from '@mui/material/Tooltip';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';
import { GoToLinkButton } from '../GoToLinkButton/GoToLinkButton';
import { useAppSelector } from '../../state/hooks';
import { getFilesWithChildren } from '../../state/selectors/all-views-resource-selectors';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

const classes = {
  root: {
    paddingLeft: '6px',
    height: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: OpossumColors.white,
  },
  leftEllipsis: {
    textOverflow: 'ellipsis',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    direction: 'rtl',
  },
  tooltip: tooltipStyle,
};

interface PathBarProps {
  sx?: SxProps;
}
export function PathBar(props: PathBarProps): ReactElement | null {
  const path = useAppSelector(getSelectedResourceId);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);

  return path ? (
    <MuiBox
      sx={getSxFromPropsAndClasses({
        styleClass: classes.root,
        sxProps: props.sx,
      })}
    >
      <MuiTooltip sx={classes.tooltip} title={path}>
        <MuiTypography sx={classes.leftEllipsis} variant={'subtitle1'}>
          <bdi>
            {removeTrailingSlashIfFileWithChildren(path, isFileWithChildren)}
          </bdi>
        </MuiTypography>
      </MuiTooltip>
      <GoToLinkButton />
    </MuiBox>
  ) : null;
}
