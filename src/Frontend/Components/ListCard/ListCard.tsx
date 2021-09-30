// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography';
import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';
import { ListCardConfig } from '../../types/types';

const defaultCardHeight = 40;

const useStyles = makeStyles({
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: defaultCardHeight,
    '&:hover': {
      cursor: 'pointer',
    },
  },
  package: {
    border: `1px ${OpossumColors.white} solid`,
    background: OpossumColors.lightestBlue,
    '&:hover': {
      background: OpossumColors.lightestBlueOnHover,
    },
  },
  externalAttribution: {
    background: OpossumColors.lightestBlue,
    '&:hover': {
      background: OpossumColors.lightestBlueOnHover,
    },
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
      background: OpossumColors.middleBlueOnHover,
    },
  },
  markedForReplacement: {
    borderRightWidth: 'medium',
    borderRightColor: OpossumColors.brown,
    background: OpossumColors.lightGrey,
    color: OpossumColors.grey,
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
        props.cardConfig.isResource ? classes.resource : classes.package,
        props.cardConfig.isExternalAttribution && classes.externalAttribution,
        props.cardConfig.isSelected && classes.selected,
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
            classes.textLine,
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
      <div className={classes.iconColumn}>
        {props.rightIcons ? props.rightIcons : null}
      </div>
    </div>
  );
}
