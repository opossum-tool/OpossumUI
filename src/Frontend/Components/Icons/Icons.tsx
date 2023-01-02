// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

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
import React, { ReactElement } from 'react';
import {
  baseIcon,
  clickableIcon,
  criticalityColor,
  OpossumColors,
  tooltipStyle,
} from '../../shared-styles';
import { SxProps } from '@mui/material';
import RectangleIcon from '@mui/icons-material/Rectangle';
import { Criticality } from '../../../shared/shared-types';

const classes = {
  clickableIcon,
  nonClickableIcon: {
    ...baseIcon,
    color: OpossumColors.darkBlue,
  },
  resourceIcon: {
    width: '18px',
    height: '18px',
    paddingLeft: '2px',
    paddingRight: '2px',
  },
  resourceDefaultColor: {
    color: OpossumColors.middleBlue,
  },
  tooltip: tooltipStyle,
  openCloseFolderIcons: {
    margin: '0px',
    padding: '0px',
    width: '16px',
    height: '20px',
  },
};

const criticalityTooltipText = {
  high: 'has high criticality signals',
  medium: 'has medium criticality signals',
  undefined: 'has signals',
};

interface IconProps {
  sx?: SxProps;
}

interface SignalIconProps {
  criticality?: Criticality;
}

interface LabelDetailIconProps extends IconProps {
  labelDetail?: string;
  disabled?: boolean;
}

export function FirstPartyIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="is first party">
      <Filter1Icon
        aria-label={'First party icon'}
        sx={{ ...classes.nonClickableIcon, ...props.sx }}
      />
    </MuiTooltip>
  );
}

export function CommentIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="has comment">
      <InsertCommentIcon
        aria-label={'Comment icon'}
        sx={{ ...classes.nonClickableIcon, ...props.sx }}
      />
    </MuiTooltip>
  );
}

export function ExcludeFromNoticeIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="excluded from notice">
      <IndeterminateCheckBoxIcon
        aria-label={'Exclude from notice icon'}
        sx={{ ...classes.nonClickableIcon, ...props.sx }}
      />
    </MuiTooltip>
  );
}

export function FollowUpIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="has follow-up">
      <ReplayIcon
        aria-label={'Follow-up icon'}
        sx={{ ...classes.nonClickableIcon, ...props.sx }}
      />
    </MuiTooltip>
  );
}

export function SignalIcon(props: SignalIconProps): ReactElement {
  return (
    <MuiTooltip
      sx={classes.tooltip}
      title={criticalityTooltipText[props.criticality ?? 'undefined']}
    >
      <AnnouncementIcon
        aria-label={'Signal icon'}
        sx={{
          ...baseIcon,
          color: criticalityColor[props.criticality ?? 'undefined'],
        }}
      />
    </MuiTooltip>
  );
}

export function DirectoryIcon({
  sx,
  labelDetail,
}: LabelDetailIconProps): ReactElement {
  return (
    <FolderOutlinedIcon
      aria-label={
        labelDetail ? `Directory icon ${labelDetail}` : 'Directory icon'
      }
      sx={{
        ...classes.resourceIcon,
        ...(sx ?? classes.resourceDefaultColor),
      }}
    />
  );
}

export function BreakpointIcon(): ReactElement {
  return (
    <WidgetsIcon
      aria-label={'Breakpoint icon'}
      sx={{ ...classes.resourceIcon, ...classes.resourceDefaultColor }}
    />
  );
}

export function FileIcon({
  sx,
  labelDetail,
}: LabelDetailIconProps): ReactElement {
  return (
    <DescriptionIcon
      aria-label={labelDetail ? `File icon ${labelDetail}` : 'File icon'}
      sx={{
        ...classes.resourceIcon,
        ...(sx ?? classes.resourceDefaultColor),
      }}
    />
  );
}

export function PreSelectedIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="was pre-selected">
      <LocalParkingIcon
        aria-label={'Pre-selected icon'}
        sx={{ ...classes.nonClickableIcon, ...props.sx }}
      />
    </MuiTooltip>
  );
}

export function SearchPackagesIcon(props: IconProps): ReactElement {
  return (
    <SearchIcon
      sx={{ ...classes.nonClickableIcon, ...props.sx }}
      aria-label={'Search packages icon'}
    />
  );
}

export function IncompletePackagesIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="contains incomplete information">
      <RectangleIcon
        aria-label={'Incomplete icon'}
        sx={{ ...classes.nonClickableIcon, ...props.sx }}
      />
    </MuiTooltip>
  );
}
