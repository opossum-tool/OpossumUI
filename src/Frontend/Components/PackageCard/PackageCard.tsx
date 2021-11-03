// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import { ListCard } from '../ListCard/ListCard';
import { getCardLabels } from './package-card-helpers';
import { makeStyles } from '@material-ui/core/styles';
import { ListCardConfig, ListCardContent } from '../../types/types';
import { clickableIcon, OpossumColors } from '../../shared-styles';
import { IconButton } from '../IconButton/IconButton';
import PlusIcon from '@material-ui/icons/Add';
import clsx from 'clsx';
import { doNothing } from '../../util/do-nothing';

const useStyles = makeStyles({
  hiddenIcon: {
    visibility: 'hidden',
  },
  followUpIcon: {
    color: OpossumColors.lightRed,
  },
  excludeFromNoticeIcon: {
    color: OpossumColors.grey,
  },
  clickableIcon: clickableIcon,
});

interface PackageCardProps {
  cardContent: ListCardContent;
  packageCount?: number;
  cardConfig: ListCardConfig;
  onClick(): void;
  onIconClick?(): void;
  openResourcesIcon?: JSX.Element;
}

function getKey(prefix: string, cardContent: ListCardContent): string {
  return `${prefix}-${cardContent.id}`;
}

export function PackageCard(props: PackageCardProps): ReactElement | null {
  const classes = useStyles();
  const packageLabels = getCardLabels(props.cardContent);
  const leftIcon = props.onIconClick ? (
    <IconButton
      tooltipTitle="add"
      placement="left"
      onClick={props.onIconClick ? props.onIconClick : doNothing}
      key={getKey('add-icon', props.cardContent)}
      icon={
        <PlusIcon
          className={clsx(
            props.cardConfig.isResolved ? classes.hiddenIcon : undefined,
            classes.clickableIcon
          )}
          aria-label={`add ${packageLabels[0] || ''}`}
        />
      }
    />
  ) : undefined;

  const rightIcons: Array<JSX.Element> = [];
  if (props.openResourcesIcon) {
    rightIcons.push(props.openResourcesIcon);
  }
  if (props.cardConfig.firstParty) {
    rightIcons.push(
      <FirstPartyIcon key={getKey('first-party-icon', props.cardContent)} />
    );
  }
  if (props.cardConfig.excludeFromNotice) {
    rightIcons.push(
      <ExcludeFromNoticeIcon
        key={getKey('exclude-icon', props.cardContent)}
        className={classes.excludeFromNoticeIcon}
      />
    );
  }
  if (props.cardConfig.followUp) {
    rightIcons.push(
      <FollowUpIcon
        key={getKey('follow-up-icon', props.cardContent)}
        className={classes.followUpIcon}
      />
    );
  }
  if (props.cardConfig.isPreSelected) {
    rightIcons.push(
      <PreSelectedIcon key={getKey('pre-selected-icon', props.cardContent)} />
    );
  }

  return (
    <ListCard
      text={packageLabels[0] || ''}
      secondLineText={packageLabels[1] || undefined}
      cardConfig={props.cardConfig}
      count={props.packageCount}
      onClick={props.onClick}
      onRightClick={(): void => {
        // TODO: replace
        console.log('this should open a context menu');
      }}
      leftIcon={leftIcon}
      rightIcons={rightIcons}
    />
  );
}
