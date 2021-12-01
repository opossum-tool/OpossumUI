// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiTypography from '@mui/material/Typography';
import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';
import { ListCardConfig } from '../../types/types';

const defaultCardHeight = 40;
const hoveredSelectedBackgroundColor = OpossumColors.middleBlueOnHover;
const hoveredBackgroundColor = OpossumColors.lightestBlueOnHover;
const defaultBackgroundColor = OpossumColors.lightestBlue;
const packageBorder = `1px ${OpossumColors.white} solid`;

const useStyles = makeStyles({
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
    height: 24,
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
    borderRadius: 2,
  },
  resolved: {
    opacity: 0.5,
  },
  textShortened: {
    overflowY: 'auto',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    paddingLeft: 6,
    marginRight: 'auto',
  },
  textShortenedFromLeftSide: {
    overflowY: 'auto',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    paddingLeft: 6,
    direction: 'rtl',
    textAlign: 'left',
    marginRight: 'auto',
  },
  count: {
    '&.MuiTypography-body2': {
      fontSize: '0.85rem',
      fontWeight: 'bold',
      lineHeight: '19px',
    },
    height: 19,
    width: 26,
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
    margin: '0 6px 0 0',
    flex: 1,
  },
  longTextInFlexbox: {
    // standard fix for css problem "child element with text in flexbox is too long"
    minWidth: 0,
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
    height: 20,
    textAlign: 'left',
    '&:hover': {
      background: OpossumColors.white,
    },
  },
});

interface ListCardProps {
  text: string;
  secondLineText?: string;
  cardConfig: ListCardConfig;
  count?: number;
  onClick(): void;
  leftIcon?: JSX.Element;
  rightIcons?: Array<JSX.Element>;
}

export function ListCard(props: ListCardProps): ReactElement | null {
  const classes = useStyles();

  function getDisplayedCount(): string {
    const count = props.count ? props.count.toString() : '';

    if (count.length < 4) {
      return count;
    } else if (count.length < 7) {
      return `${count.slice(0, -3)}k`;
    } else {
      return `${count.slice(0, -6)}M`;
    }
  }

  return (
    <div
      className={clsx(
        classes.root,
        props.cardConfig.isResource
          ? classes.resource
          : props.cardConfig.isContextMenuOpen
          ? classes.hoveredPackage
          : classes.package,
        props.cardConfig.isExternalAttribution
          ? props.cardConfig.isContextMenuOpen
            ? classes.hoveredExternalAttribution
            : classes.externalAttribution
          : null,
        props.cardConfig.isHeader ? classes.header : classes.hover,
        props.cardConfig.isSelected
          ? props.cardConfig.isContextMenuOpen
            ? classes.hoveredSelected
            : classes.selected
          : null,
        props.cardConfig.isMarkedForReplacement && classes.markedForReplacement,
        props.cardConfig.isResolved && classes.resolved
      )}
      onClick={props.onClick}
    >
      <div className={classes.iconColumn}>
        {props.leftIcon ? props.leftIcon : null}
        {getDisplayedCount() ? (
          <MuiTypography variant={'body2'} className={classes.count}>
            {getDisplayedCount()}
          </MuiTypography>
        ) : null}
      </div>
      <div
        className={clsx(
          classes.textLines,
          props.cardConfig.isResource ? null : classes.longTextInFlexbox
        )}
      >
        <MuiTypography
          variant={'body2'}
          className={clsx(
            props.cardConfig.isHeader ? classes.header : classes.textLine,
            props.cardConfig.isResource
              ? classes.textShortenedFromLeftSide
              : classes.textShortened
          )}
        >
          {props.cardConfig.isResource ? <bdi>{props.text}</bdi> : props.text}
        </MuiTypography>
        {props.secondLineText ? (
          <MuiTypography
            variant={'body2'}
            className={clsx(
              classes.textLine,
              props.cardConfig.isResource
                ? classes.textShortenedFromLeftSide
                : classes.textShortened
            )}
          >
            {props.cardConfig.isResource ? (
              <bdi>{props.secondLineText}</bdi>
            ) : (
              props.secondLineText
            )}
          </MuiTypography>
        ) : null}
      </div>
      {props.rightIcons ? (
        <div className={classes.iconColumn}>{props.rightIcons}</div>
      ) : null}
    </div>
  );
}
