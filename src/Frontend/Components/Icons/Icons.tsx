// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import AnnouncementIcon from '@mui/icons-material/Announcement';
import DescriptionIcon from '@mui/icons-material/Description';
import ExploreIcon from '@mui/icons-material/Explore';
import Filter1Icon from '@mui/icons-material/Filter1';
import FolderOutlinedIcon from '@mui/icons-material/Folder';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import ReplayIcon from '@mui/icons-material/Replay';
import RuleIcon from '@mui/icons-material/Rule';
import StarIcon from '@mui/icons-material/Star';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { SxProps } from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon, criticalityColor, OpossumColors } from '../../shared-styles';

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
};

interface IconProps {
  sx?: SxProps;
  noTooltip?: boolean;
  className?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

interface LabelDetailIconProps extends IconProps {
  labelDetail?: string;
  disabled?: boolean;
}

export function FirstPartyIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.filters.firstParty}
      placement={tooltipPlacement}
      disableInteractive
    >
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

export function ExcludeFromNoticeIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.excludedFromNotice}
      placement={tooltipPlacement}
      disableInteractive
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

export function IncompleteIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.packageLists.incompleteInformation}
      placement={tooltipPlacement}
      disableInteractive
    >
      <RuleIcon
        aria-label={'Incomplete icon'}
        sx={{
          ...baseIcon,
          color: `${OpossumColors.brown} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}

export function FollowUpIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.followUp}
      placement={tooltipPlacement}
      disableInteractive
    >
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

export function NeedsReviewIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.needsReview}
      placement={tooltipPlacement}
      disableInteractive
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

export function CriticalityIcon({
  className,
  criticality,
  noTooltip,
  tooltip,
  sx,
  tooltipPlacement,
}: IconProps & {
  criticality?: Criticality;
  tooltip?: string;
}) {
  if (!criticality) {
    return null;
  }

  return (
    <MuiTooltip
      title={noTooltip ? undefined : tooltip}
      placement={tooltipPlacement}
      disableInteractive
    >
      <WhatshotIcon
        aria-label={'Criticality icon'}
        sx={{
          ...baseIcon,
          color: `${criticalityColor[criticality]} !important`,
          ...sx,
        }}
        className={className}
      />
    </MuiTooltip>
  );
}

export function SignalIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.resourceBrowser.hasSignals}
      placement={tooltipPlacement || 'right'}
      disableInteractive
    >
      <AnnouncementIcon
        aria-label={'Signal icon'}
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

export function DirectoryIcon({ sx, labelDetail }: LabelDetailIconProps) {
  return (
    <FolderOutlinedIcon
      aria-label={
        labelDetail ? `Directory icon ${labelDetail}` : 'Directory icon'
      }
      sx={{
        ...classes.resourceIcon,
        ...classes.resourceDefaultColor,
        ...sx,
      }}
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
  return (
    <DescriptionIcon
      aria-label={labelDetail ? `File icon ${labelDetail}` : 'File icon'}
      sx={{
        ...classes.resourceIcon,
        ...classes.resourceDefaultColor,
        ...sx,
      }}
    />
  );
}

export function PreSelectedIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.preselected}
      placement={tooltipPlacement}
      disableInteractive
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

export function PreferredIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.currentlyPreferred}
      placement={tooltipPlacement}
      disableInteractive
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

export function WasPreferredIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.previouslyPreferred}
      placement={tooltipPlacement}
      disableInteractive
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

export function ModifiedPreferredIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.auditingOptions.modifiedPreferred}
      placement={tooltipPlacement}
      disableInteractive
    >
      <StarIcon
        aria-label={'Modified preferred icon'}
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

export function SourceIcon({
  className,
  noTooltip,
  sx,
  tooltipPlacement,
}: IconProps) {
  return (
    <MuiTooltip
      title={noTooltip ? undefined : text.attributionColumn.source}
      placement={tooltipPlacement}
      disableInteractive
    >
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
