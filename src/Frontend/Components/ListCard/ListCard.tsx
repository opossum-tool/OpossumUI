// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { merge } from 'lodash';
import { ReactElement } from 'react';

import { Criticality } from '../../../shared/shared-types';
import { HighlightingColor } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { ListCardConfig } from '../../types/types';

const defaultCardHeight = '40px';
const hoveredSelectedBackgroundColor = OpossumColors.middleBlueOnHover;
const hoveredBackgroundColor = OpossumColors.lightestBlueOnHover;
const defaultBackgroundColor = OpossumColors.lightestBlue;
const packageBorder = `1px ${OpossumColors.white} solid`;

const classes = {
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: defaultCardHeight,
  },
  hover: {
    '&:hover': {
      cursor: 'pointer',
    },
  },
  hoveredPackage: {
    border: packageBorder,
    background: hoveredBackgroundColor,
  },
  package: {
    border: packageBorder,
    background: defaultBackgroundColor,
    '&:hover': {
      background: hoveredBackgroundColor,
    },
  },
  externalAttribution: {
    background: defaultBackgroundColor,
    '&:hover': {
      background: hoveredBackgroundColor,
    },
  },
  hoveredExternalAttribution: {
    background: hoveredBackgroundColor,
  },
  resource: {
    background: OpossumColors.white,
    '&:hover': {
      background: OpossumColors.whiteOnHover,
    },
    height: '24px',
  },
  selected: {
    background: OpossumColors.middleBlue,
    '&:hover': {
      background: hoveredSelectedBackgroundColor,
    },
  },
  hoveredSelected: {
    background: hoveredSelectedBackgroundColor,
  },
  markedForReplacement: {
    borderRightWidth: 'medium',
    borderRightColor: OpossumColors.brown,
    borderRadius: '2px',
  },
  resolved: {
    opacity: 0.5,
  },
  highCriticality: {
    width: '4px',
    height: defaultCardHeight,
    background: OpossumColors.orange,
  },
  mediumCriticality: {
    width: '4px',
    height: defaultCardHeight,
    background: OpossumColors.mediumOrange,
  },
  textShortened: {
    overflowY: 'auto',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  textShortenedFromLeftSide: {
    overflowY: 'auto',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    textAlign: 'left',
  },
  count: {
    '&.MuiTypography-body2': {
      fontSize: '0.85rem',
      fontWeight: 'bold',
      lineHeight: '19px',
    },
    height: '19px',
    width: '26px',
    textAlign: 'center',
    writingMode: 'horizontal-tb',
  },
  iconColumn: {
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'flex-end',
    flexWrap: 'wrap-reverse',
    // fix for width of column flexbox container not growing after wrap
    // -> use row flexbox with vertical writing mode
    writingMode: 'vertical-lr',
    height: defaultCardHeight,
  },
  textLines: {
    flex: 1,
  },
  longTextInFlexbox: {
    // standard fix for css problem "child element with text in flexbox is too long"
    minWidth: '0px',
  },
  textLine: {
    '&.MuiTypography-body2': {
      fontSize: '0.85rem',
    },
  },
  excludeFromNotice: {
    color: OpossumColors.darkBlue,
  },
  header: {
    background: OpossumColors.white,
    '&.MuiTypography-body2': {
      fontWeight: 'bold',
    },
    height: '20px',
    textAlign: 'left',
    '&:hover': {
      background: OpossumColors.white,
    },
  },
};

const MAX_RIGHT_PADDING = 60;
const PADDING_PER_ICON_COLUMN = 20;

interface ListCardProps {
  text: string;
  secondLineText?: string;
  cardConfig: ListCardConfig;
  count?: number;
  onClick(): void;
  leftIcon?: JSX.Element;
  rightIcons?: Array<JSX.Element>;
  leftElement?: JSX.Element;
  highlighting?: HighlightingColor;
}

export function ListCard(props: ListCardProps): ReactElement | null {
  const displayedCount = ((): string => {
    const digitsInAThousand = 4;
    const digitsInAMillion = 7;
    const count = props.count ? props.count.toString() : '';

    if (count.length < digitsInAThousand) {
      return count;
    } else if (count.length < digitsInAMillion) {
      return `${count.slice(0, -(digitsInAThousand - 1))}k`;
    } else {
      return `${count.slice(0, -(digitsInAMillion - 1))}M`;
    }
  })();

  function calculateRightPadding(): number {
    return Math.max(
      0,
      MAX_RIGHT_PADDING -
        Math.ceil((props.rightIcons?.length || 0) / 2) *
          PADDING_PER_ICON_COLUMN,
    );
  }

  return (
    <MuiBox sx={getSx(props.cardConfig, props.highlighting)}>
      {props.leftElement}
      <MuiBox
        sx={{
          ...classes.root,
          ...(props.cardConfig.isResource ? {} : classes.longTextInFlexbox),
        }}
        onClick={props.onClick}
      >
        <MuiBox sx={classes.iconColumn}>
          {props.leftIcon}
          {displayedCount ? (
            <MuiTypography variant={'body2'} sx={classes.count}>
              {displayedCount}
            </MuiTypography>
          ) : null}
        </MuiBox>
        <MuiBox
          sx={{
            ...classes.textLines,
            ...(props.cardConfig.isResource ? {} : classes.longTextInFlexbox),
            ...(props.highlighting && {
              paddingRight: `${calculateRightPadding()}px`,
            }),
          }}
        >
          <MuiTypography
            variant={'body2'}
            sx={{
              ...(!props.leftIcon && !displayedCount && { paddingLeft: '6px' }),
              ...(props.cardConfig.isHeader
                ? classes.header
                : classes.textLine),
              ...(props.cardConfig.isResource
                ? classes.textShortenedFromLeftSide
                : classes.textShortened),
            }}
          >
            {props.cardConfig.isResource ? <bdi>{props.text}</bdi> : props.text}
          </MuiTypography>
          {props.secondLineText ? (
            <MuiTypography
              variant={'body2'}
              sx={{
                ...(!props.leftIcon &&
                  !displayedCount && { paddingLeft: '6px' }),
                ...classes.textLine,
                ...(props.cardConfig.isResource
                  ? classes.textShortenedFromLeftSide
                  : classes.textShortened),
              }}
            >
              {props.cardConfig.isResource ? (
                <bdi>{props.secondLineText}</bdi>
              ) : (
                props.secondLineText
              )}
            </MuiTypography>
          ) : null}
        </MuiBox>
        {props.rightIcons ? (
          <MuiBox sx={classes.iconColumn}>{props.rightIcons}</MuiBox>
        ) : null}
      </MuiBox>
      <MuiBox
        sx={{
          ...(props.cardConfig.criticality === Criticality.High
            ? classes.highCriticality
            : props.cardConfig.criticality === Criticality.Medium
            ? classes.mediumCriticality
            : {}),
        }}
      />
    </MuiBox>
  );
}

function getSx(
  cardConfig: ListCardConfig,
  highlighting?: HighlightingColor,
): SxProps {
  let sxProps: SxProps = { ...classes.root };

  if (cardConfig.isResource) {
    sxProps = merge(sxProps, classes.resource);
  } else {
    if (cardConfig.isContextMenuOpen) {
      sxProps = merge(sxProps, classes.hoveredPackage);
    } else {
      sxProps = merge(sxProps, classes.package);
    }
  }

  if (cardConfig.isExternalAttribution) {
    if (cardConfig.isContextMenuOpen) {
      sxProps = merge(sxProps, classes.hoveredExternalAttribution);
    } else {
      sxProps = merge(sxProps, classes.externalAttribution);
    }
  }

  if (cardConfig.isHeader) {
    sxProps = merge(sxProps, classes.header);
  } else {
    sxProps = merge(sxProps, classes.hover);
  }

  if (cardConfig.isMarkedForReplacement) {
    sxProps = merge(sxProps, classes.markedForReplacement);
  }

  if (cardConfig.isResolved) {
    sxProps = merge(sxProps, classes.resolved);
  }

  if (cardConfig.isSelected) {
    if (cardConfig.isContextMenuOpen) {
      sxProps = merge(sxProps, classes.hoveredSelected);
    } else {
      if (highlighting) {
        sxProps = merge(
          sxProps,
          getHighlightedListCardStyle(highlighting, true),
        );
      } else {
        sxProps = merge(sxProps, classes.selected);
      }
    }
  } else if (highlighting) {
    sxProps = merge(sxProps, getHighlightedListCardStyle(highlighting, false));
  }

  return sxProps;
}

function getHighlightedListCardStyle(
  color: HighlightingColor,
  selected: boolean,
): SxProps {
  const highlightColor =
    color === HighlightingColor.LightOrange
      ? OpossumColors.lightOrange
      : OpossumColors.darkOrange;
  const backgroundColor = selected
    ? OpossumColors.middleBlue
    : defaultBackgroundColor;
  const highlightColorOnHover =
    color === HighlightingColor.LightOrange
      ? OpossumColors.lightOrangeOnHover
      : OpossumColors.darkOrangeOnHover;
  const backgroundColorOnHover = selected
    ? hoveredSelectedBackgroundColor
    : hoveredBackgroundColor;

  return getHighlightedStyleClass(
    highlightColor,
    backgroundColor,
    highlightColorOnHover,
    backgroundColorOnHover,
    packageBorder,
  );
}

function getHighlightedStyleClass(
  highlightColor: string,
  backgroundColor: string,
  highlightColorOnHover: string,
  backgroundColorOnHover: string,
  border: string,
): SxProps {
  return {
    border,
    background: getHighlightedBackground(highlightColor, backgroundColor),
    '&:hover': {
      background: getHighlightedBackground(
        highlightColorOnHover,
        backgroundColorOnHover,
      ),
    },
  };
}

function getHighlightedBackground(
  highlightColor: string,
  backgroundColor: string,
): string {
  return (
    'linear-gradient(225deg, ' +
    highlightColor +
    ' 44.5px, ' +
    backgroundColor +
    ' 0) 0 0/100% 40px no-repeat'
  );
}
