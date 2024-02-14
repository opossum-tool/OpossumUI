// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import MuiTooltip from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';
import { merge } from 'lodash';
import { useMemo } from 'react';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { HighlightingColor } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { maybePluralize } from '../../util/maybe-pluralize';

export interface ListCardConfig {
  criticality?: Criticality;
  excludeFromNotice?: boolean;
  firstParty?: boolean;
  followUp?: boolean;
  hideCount?: boolean;
  isPreSelected?: boolean;
  isPreferred?: boolean;
  isResolved?: boolean;
  isSelected?: boolean;
  needsReview?: boolean;
  wasPreferred?: boolean;
}

export const LIST_CARD_HEIGHT = 40;

const hoveredSelectedBackgroundColor = OpossumColors.middleBlue;
const hoveredBackgroundColor = OpossumColors.lightestBlueOnHover;
const defaultBackgroundColor = OpossumColors.lightestBlue;

const classes = {
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: LIST_CARD_HEIGHT,
    paddingLeft: '8px',
  },
  innerRoot: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: LIST_CARD_HEIGHT,
    overflow: 'hidden',
  },
  hover: {
    '&:hover': {
      cursor: 'pointer',
      background: hoveredBackgroundColor,
    },
  },
  selected: {
    background: OpossumColors.middleBlue,
    '&:hover': {
      background: hoveredSelectedBackgroundColor,
    },
  },
  resolved: {
    opacity: 0.5,
    backgroundColor: 'white',
  },
  iconColumn: {
    display: 'grid',
    gridTemplateRows: '1fr 1fr',
    gridAutoFlow: 'column',
    direction: 'rtl',
  },
  textLines: {
    flex: 1,
    overflow: 'hidden',
  },
  textLine: {
    paddingLeft: '6px',
    userSelect: 'none',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
};

const MAX_RIGHT_PADDING = 60;
const PADDING_PER_ICON_COLUMN = 20;

interface ListCardProps {
  text: string;
  secondLineText?: string;
  count?: number;
  cardConfig: ListCardConfig;
  onClick?(): void;
  rightIcons?: Array<React.ReactNode>;
  leftElement?: React.ReactNode;
  highlighting?: HighlightingColor;
}

export function ListCard(props: ListCardProps) {
  const paddingRight = useMemo(
    () =>
      Math.max(
        0,
        MAX_RIGHT_PADDING -
          Math.ceil((props.rightIcons?.length || 0) / 2) *
            PADDING_PER_ICON_COLUMN,
      ),
    [props.rightIcons?.length],
  );

  return (
    <MuiBox
      sx={useMemo(
        () => getSx(props.cardConfig, props.highlighting, !!props.onClick),
        [props.cardConfig, props.highlighting, props.onClick],
      )}
    >
      {props.leftElement}
      <MuiBox sx={classes.innerRoot} onClick={props.onClick}>
        {props.count && (
          <MuiTooltip
            title={maybePluralize(
              props.count,
              text.attributionColumn.occurrence,
              {
                showOne: true,
              },
            )}
            enterDelay={500}
          >
            <MuiChip
              sx={{ minWidth: '24px', marginRight: '4px', userSelect: 'none' }}
              label={new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(props.count)}
              size={'small'}
            />
          </MuiTooltip>
        )}
        <MuiBox
          sx={{
            paddingRight: props.highlighting ? `${paddingRight}px` : '14px',
            ...classes.textLines,
          }}
        >
          <MuiTypography sx={classes.textLine}>{props.text}</MuiTypography>
          {props.secondLineText ? (
            <MuiTypography sx={classes.textLine}>
              {props.secondLineText}
            </MuiTypography>
          ) : null}
        </MuiBox>
        <MuiBox sx={classes.iconColumn}>{props.rightIcons}</MuiBox>
      </MuiBox>
    </MuiBox>
  );
}

function getSx(
  cardConfig: ListCardConfig,
  highlighting: HighlightingColor | undefined,
  clickable: boolean,
): SxProps {
  let sxProps: SxProps = { ...classes.root };

  if (clickable) {
    sxProps = merge(sxProps, classes.hover);
  }

  if (cardConfig.isResolved) {
    sxProps = merge(sxProps, classes.resolved);
  }

  if (cardConfig.isSelected) {
    if (highlighting) {
      sxProps = merge(
        sxProps,
        getHighlightedListCardStyle(highlighting, true, clickable),
      );
    } else {
      sxProps = merge(sxProps, classes.selected);
    }
  } else if (highlighting) {
    sxProps = merge(
      sxProps,
      getHighlightedListCardStyle(highlighting, false, clickable),
    );
  }

  return sxProps;
}

function getHighlightedListCardStyle(
  color: HighlightingColor,
  selected: boolean,
  clickable: boolean,
): SxProps {
  const highlightColor =
    color === HighlightingColor.LightOrange
      ? OpossumColors.lightOrange
      : OpossumColors.darkOrange;
  const backgroundColor = selected
    ? OpossumColors.middleBlue
    : defaultBackgroundColor;
  const backgroundColorOnHover = selected
    ? hoveredSelectedBackgroundColor
    : hoveredBackgroundColor;

  return {
    background: getHighlightedBackground(highlightColor, backgroundColor),
    ...(clickable && {
      '&:hover': {
        background: getHighlightedBackground(
          highlightColor,
          backgroundColorOnHover,
        ),
      },
    }),
  };
}

function getHighlightedBackground(
  highlightColor: string,
  backgroundColor: string,
): string {
  return `linear-gradient(225deg, ${highlightColor} 44.5px, ${backgroundColor} 0) 0 0/100% 40px no-repeat`;
}
