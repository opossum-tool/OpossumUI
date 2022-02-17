// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import MuiTypography from '@mui/material/Typography';
import MuiTooltip from '@mui/material/Tooltip';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';
import { GoToLinkButton } from '../GoToLinkButton/GoToLinkButton';
import { useAppSelector } from '../../state/hooks';
import { getFilesWithChildren } from '../../state/selectors/all-views-resource-selectors';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';

const useStyles = makeStyles({
  root: {
    paddingLeft: 6,
    height: 24,
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
});

export function PathBar(): ReactElement | null {
  const classes = useStyles();
  const path = useAppSelector(getSelectedResourceId);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);

  return path ? (
    <div className={classes.root}>
      <MuiTooltip classes={{ tooltip: classes.tooltip }} title={path}>
        <MuiTypography className={classes.leftEllipsis} variant={'subtitle1'}>
          <bdi>
            {removeTrailingSlashIfFileWithChildren(path, isFileWithChildren)}
          </bdi>
        </MuiTypography>
      </MuiTooltip>
      <GoToLinkButton />
    </div>
  ) : null;
}
