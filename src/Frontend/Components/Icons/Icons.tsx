// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import Filter1Icon from '@mui/icons-material/Filter1';
import FolderOutlinedIcon from '@mui/icons-material/Folder';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import InsertCommentIcon from '@mui/icons-material/InsertComment';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import RectangleIcon from '@mui/icons-material/Rectangle';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import { ReactElement } from 'react';

import { Criticality } from '../../../shared/shared-types';
import {
  baseIcon,
  clickableIcon,
  criticalityColor,
  OpossumColors,
  tooltipStyle,
} from '../../shared-styles';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

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
  preferredIcon: {
    ...baseIcon,
    color: OpossumColors.mediumOrange,
  },
  wasPreferredIcon: {
    ...baseIcon,
    color: OpossumColors.mediumGrey,
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
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
      />
    </MuiTooltip>
  );
}

export function CommentIcon(props: IconProps): ReactElement {
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

export function ExcludeFromNoticeIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="excluded from notice">
      <IndeterminateCheckBoxIcon
        aria-label={'Exclude from notice icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
      />
    </MuiTooltip>
  );
}

export function FollowUpIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="has follow-up">
      <ReplayIcon
        aria-label={'Follow-up icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
      />
    </MuiTooltip>
  );
}

export function NeedsReviewIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="needs review">
      <QuestionMarkIcon
        aria-label={'Needs-review icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
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

export function PreSelectedIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="was pre-selected">
      <LocalParkingIcon
        aria-label={'Pre-selected icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.nonClickableIcon,
          sxProps: props.sx,
        })}
      />
    </MuiTooltip>
  );
}

export function SearchPackagesIcon(props: IconProps): ReactElement {
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

export function IncompleteAttributionsIcon(props: IconProps): ReactElement {
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

export function ManuallyAddedListItemIcon(props: IconProps): ReactElement {
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

export function MissingPackageNameIcon(props: IconProps): ReactElement {
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

export function LocateSignalsIcon(props: IconProps): ReactElement {
  return <MyLocationIcon aria-label={'locate signals icon'} sx={props.sx} />;
}

export function LocateSignalsIconWithTooltip(): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="signal matches locate filters">
      <MuiBox>
        <LocateSignalsIcon sx={classes.nonClickableIcon} />
      </MuiBox>
    </MuiTooltip>
  );
}

export function PreferredIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="is preferred">
      <StarIcon
        aria-label={'Preferred icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.preferredIcon,
          sxProps: props.sx,
        })}
        data-testid={'preferred-icon'}
      />
    </MuiTooltip>
  );
}

export function WasPreferredIcon(props: IconProps): ReactElement {
  return (
    <MuiTooltip sx={classes.tooltip} title="was previously preferred">
      <StarIcon
        aria-label={'Was Preferred icon'}
        sx={getSxFromPropsAndClasses({
          styleClass: classes.wasPreferredIcon,
          sxProps: props.sx,
        })}
        data-testid={'was-preferred-icon'}
      />
    </MuiTooltip>
  );
}
