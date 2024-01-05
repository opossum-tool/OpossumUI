// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import ExploreIcon from '@mui/icons-material/Explore';
import Filter1Icon from '@mui/icons-material/Filter1';
import FolderOutlinedIcon from '@mui/icons-material/Folder';
import InsertCommentIcon from '@mui/icons-material/InsertComment';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import RectangleIcon from '@mui/icons-material/Rectangle';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  baseIcon,
  criticalityColor,
  OpossumColors,
  tooltipStyle,
} from '../../shared-styles';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

const classes = {
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
};

const criticalityTooltipText = {
  high: 'has high criticality signals',
  medium: 'has medium criticality signals',
  undefined: 'has signals',
};

interface IconProps {
  sx?: SxProps;
  noTooltip?: boolean;
  className?: string;
}

interface SignalIconProps {
  criticality?: Criticality;
}

interface LabelDetailIconProps extends IconProps {
  labelDetail?: string;
  disabled?: boolean;
}

export function FirstPartyIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip title={noTooltip ? undefined : 'is first party'}>
      <Filter1Icon
        aria-label={'First party icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.darkBlue} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <MuiTooltip sx={classes.tooltip} title="has comment">
      <InsertCommentIcon
        aria-label={'Comment icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
      />
    </MuiTooltip>
  );
}

export function ExcludeFromNoticeIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.excludedFromNotice}
    >
      <PlaylistRemoveIcon
        aria-label={'Exclude from notice icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.grey} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}

export function FollowUpIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip title={noTooltip ? undefined : text.auditingOptions.followUp}>
      <ReplayIcon
        aria-label={'Follow-up icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.red} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}

export function NeedsReviewIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.needsReview}
    >
      <QuestionMarkIcon
        aria-label={'Needs-review icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.orange} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}

export function SignalIcon(props: SignalIconProps) {
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

export function DirectoryIcon({ sx, labelDetail }: LabelDetailIconProps) {
  const sxProps = sx
    ? getSxFromPropsAndClasses({
        styleClass: classes.resourceIcon,
        sxProps: sx,
      })
    : {
        ...classes.resourceIcon,
        ...classes.resourceDefaultColor,
      };

  return (
    <FolderOutlinedIcon
      aria-label={
        labelDetail ? `Directory icon ${labelDetail}` : 'Directory icon'
      }
      sx={sxProps}
    />
  );
}

export function BreakpointIcon() {
  return (
    <WidgetsIcon
      aria-label={'Breakpoint icon'}
      sx={{ ...classes.resourceIcon, ...classes.resourceDefaultColor }}
    />
  );
}

export function FileIcon({ sx, labelDetail }: LabelDetailIconProps) {
  const sxProps = sx
    ? getSxFromPropsAndClasses({
        styleClass: classes.resourceIcon,
        sxProps: sx,
      })
    : {
        ...classes.resourceIcon,
        ...classes.resourceDefaultColor,
      };

  return (
    <DescriptionIcon
      aria-label={labelDetail ? `File icon ${labelDetail}` : 'File icon'}
      sx={sxProps}
    />
  );
}

export function PreSelectedIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.preselected}
    >
      <LocalParkingIcon
        aria-label={'Pre-selected icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.darkBlue} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}

export function SearchPackagesIcon(props: IconProps) {
  return (
    <SearchIcon
      sx={getSxFromPropsAndClasses({
        styleClass: classes.nonClickableIcon,
        sxProps: props.sx,
      })}
      aria-label={'Search packages icon'}
    />
  );
}

export function IncompleteAttributionsIcon(props: IconProps) {
  return (
    <MuiTooltip sx={classes.tooltip} title="contains incomplete information">
      <RectangleIcon
        aria-label={'Incomplete icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
      />
    </MuiTooltip>
  );
}

export function ManuallyAddedListItemIcon(props: IconProps) {
  return (
    <MuiTooltip
      describeChild={true}
      sx={classes.tooltip}
      title={'entry was added manually'}
      placement={'left'}
    >
      <AutoAwesomeIcon sx={props.sx} />
    </MuiTooltip>
  );
}

export function MissingPackageNameIcon(props: IconProps) {
  return (
    <MuiTooltip sx={classes.tooltip} title="is missing a package name">
      <RectangleIcon
        aria-label={'Missing packagename icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
      />
    </MuiTooltip>
  );
}

export function LocateSignalsIcon(props: IconProps) {
  return <MyLocationIcon aria-label={'locate signals icon'} sx={props.sx} />;
}

export function LocateSignalsIconWithTooltip() {
  return (
    <MuiTooltip sx={classes.tooltip} title="signal matches locate filters">
      <MuiBox>
        <LocateSignalsIcon sx={classes.nonClickableIcon} />
      </MuiBox>
    </MuiTooltip>
  );
}

export function PreferredIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.currentlyPreferred}
    >
      <StarIcon
        aria-label={'Preferred icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.mediumOrange} !important`,
          ...sx,
        }}
        className={className}
        data-testid={'preferred-icon'}
      />
    </MuiTooltip>
  );
}

export function WasPreferredIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.previouslyPreferred}
    >
      <StarIcon
        aria-label={'Was Preferred icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.mediumGrey} !important`,
          ...sx,
        }}
        className={className}
        data-testid={'was-preferred-icon'}
      />
    </MuiTooltip>
  );
}

export function SourceIcon({ className, noTooltip, sx }: IconProps) {
  return (
    <MuiTooltip title={noTooltip ? undefined : text.attributionColumn.source}>
      <ExploreIcon
        aria-label={'Source icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.black} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}
