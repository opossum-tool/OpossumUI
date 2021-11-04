// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import MuiTooltip from '@material-ui/core/Tooltip';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Filter1Icon from '@material-ui/icons/Filter1';
import InsertCommentIcon from '@material-ui/icons/InsertComment';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import WidgetsIcon from '@material-ui/icons/Widgets';
import FolderOutlinedIcon from '@material-ui/icons/Folder';
import DescriptionIcon from '@material-ui/icons/Description';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import ReplayIcon from '@material-ui/icons/Replay';
import LocalParkingIcon from '@material-ui/icons/LocalParking';
import clsx from 'clsx';
import React, { ReactElement } from 'react';
import {
  OpossumColors,
  tooltipStyle,
  baseIcon,
  clickableIcon,
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

interface ClickableIconProps extends IconProps {
  label: string;
  onClick: () => void;
}

export function ClosedFolderIcon(props: ClickableIconProps): ReactElement {
  const classes = useStyles();

  return (
    <ChevronRightIcon
      className={clsx(
        classes.clickableIcon,
        classes.openCloseFolderIcons,
        props.className
      )}
      onClick={(event): void => {
        event.stopPropagation();
        props.onClick();
      }}
      aria-label={`closed folder ${props.label}`}
    />
  );
}

export function OpenFolderIcon(props: ClickableIconProps): ReactElement {
  const classes = useStyles();

  return (
    <ExpandMoreIcon
      className={clsx(
        classes.clickableIcon,
        classes.openCloseFolderIcons,
        props.className
      )}
      onClick={(event): void => {
        event.stopPropagation();
        props.onClick();
      }}
      aria-label={`open folder ${props.label}`}
    />
  );
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
