// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography';
import MuiTooltip from '@material-ui/core/Tooltip';
import { useSelector } from 'react-redux';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';
import { getIsFileWithChildren } from '../../state/selectors/all-views-resource-selectors';
import { GoToLinkButton } from '../GoToLinkButton/GoToLinkButton';

const useStyles = makeStyles({
  root: {
    paddingLeft: 6,
    height: 24,
    display: 'flex',
    justifyContent: 'flex-start',
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
  openLinkIcon: {
    marginLeft: 'auto',
  },
});

export function PathBar(): ReactElement | null {
  const classes = useStyles();
  const path = useSelector(getSelectedResourceId);
  const isFileWithChildren = useSelector(getIsFileWithChildren);

  return path ? (
    <div className={classes.root}>
      <MuiTooltip classes={{ tooltip: classes.tooltip }} title={path}>
        <MuiTypography className={classes.leftEllipsis} variant={'subtitle1'}>
          <bdi>
            {removeTrailingSlashIfFileWithChildren(path, isFileWithChildren)}
          </bdi>
        </MuiTypography>
      </MuiTooltip>
      <GoToLinkButton className={classes.openLinkIcon} />
    </div>
  ) : null;
}
