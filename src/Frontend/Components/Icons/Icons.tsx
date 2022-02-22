// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiTooltip from '@mui/material/Tooltip';
import Filter1Icon from '@mui/icons-material/Filter1';
import InsertCommentIcon from '@mui/icons-material/InsertComment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import WidgetsIcon from '@mui/icons-material/Widgets';
import FolderOutlinedIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import ReplayIcon from '@mui/icons-material/Replay';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import SearchIcon from '@mui/icons-material/Search';
import clsx from 'clsx';
import React, { ReactElement } from 'react';
import {
  baseIcon,
  clickableIcon,
  OpossumColors,
  tooltipStyle,
} from '../../shared-styles';

const useStyles = makeStyles({
  clickableIcon,
  nonClickableIcon: {
    ...baseIcon,
    color: OpossumColors.darkBlue,
  },
  resourceIcon: {
    width: 18,
    height: 18,
    paddingLeft: '2px',
    paddingRight: '2px',
  },
  resourceDefaultColor: {
    color: OpossumColors.middleBlue,
  },
  tooltip: tooltipStyle,
  openCloseFolderIcons: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 20,
  },
});

interface IconProps {
  className?: string;
}

interface LabelDetailIconProps extends IconProps {
  labelDetail?: string;
  disabled?: boolean;
}

export function FirstPartyIcon(props: IconProps): ReactElement {
  const classes = useStyles();
  return (
    <MuiTooltip classes={{ tooltip: classes.tooltip }} title="is first party">
      <Filter1Icon
        aria-label={'First party icon'}
        className={clsx(classes.nonClickableIcon, props.className)}
      />
    </MuiTooltip>
  );
}

export function CommentIcon(props: IconProps): ReactElement {
  const classes = useStyles();
  return (
    <MuiTooltip classes={{ tooltip: classes.tooltip }} title="has comment">
      <InsertCommentIcon
        aria-label={'Comment icon'}
        className={clsx(classes.nonClickableIcon, props.className)}
      />
    </MuiTooltip>
  );
}

export function ExcludeFromNoticeIcon(props: IconProps): ReactElement {
  const classes = useStyles();
  return (
    <MuiTooltip
      classes={{ tooltip: classes.tooltip }}
      title="excluded from notice"
    >
      <IndeterminateCheckBoxIcon
        aria-label={'Exclude from notice icon'}
        className={clsx(classes.nonClickableIcon, props.className)}
      />
    </MuiTooltip>
  );
}

export function FollowUpIcon(props: IconProps): ReactElement {
  const classes = useStyles();
  return (
    <MuiTooltip classes={{ tooltip: classes.tooltip }} title="has follow-up">
      <ReplayIcon
        aria-label={'Follow-up icon'}
        className={clsx(classes.nonClickableIcon, props.className)}
      />
    </MuiTooltip>
  );
}

export function SignalIcon(): ReactElement {
  const classes = useStyles();
  return (
    <MuiTooltip classes={{ tooltip: classes.tooltip }} title="has signals">
      <AnnouncementIcon
        aria-label={'Signal icon'}
        className={classes.nonClickableIcon}
      />
    </MuiTooltip>
  );
}

export function DirectoryIcon({
  className,
  labelDetail,
}: LabelDetailIconProps): ReactElement {
  const classes = useStyles();
  return (
    <FolderOutlinedIcon
      aria-label={
        labelDetail ? `Directory icon ${labelDetail}` : 'Directory icon'
      }
      className={clsx(
        classes.resourceIcon,
        className ?? classes.resourceDefaultColor
      )}
    />
  );
}

export function BreakpointIcon(): ReactElement {
  const classes = useStyles();
  return (
    <WidgetsIcon
      aria-label={'Breakpoint icon'}
      className={clsx(classes.resourceIcon, classes.resourceDefaultColor)}
    />
  );
}

export function FileIcon({
  className,
  labelDetail,
}: LabelDetailIconProps): ReactElement {
  const classes = useStyles();
  return (
    <DescriptionIcon
      aria-label={labelDetail ? `File icon ${labelDetail}` : 'File icon'}
      className={clsx(
        classes.resourceIcon,
        className ?? classes.resourceDefaultColor
      )}
    />
  );
}

export function PreSelectedIcon(props: IconProps): ReactElement {
  const classes = useStyles();
  return (
    <MuiTooltip classes={{ tooltip: classes.tooltip }} title="was pre-selected">
      <LocalParkingIcon
        aria-label={'Pre-selected icon'}
        className={clsx(classes.nonClickableIcon, props.className)}
      />
    </MuiTooltip>
  );
}

export function SearchPackagesIcon(props: IconProps): ReactElement {
  const classes = useStyles();
  return (
    <SearchIcon
      className={clsx(classes.nonClickableIcon, props.className)}
      aria-label={'Search packages icon'}
    />
  );
}
