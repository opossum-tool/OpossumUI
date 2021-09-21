// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { AddIcon, FirstPartyIcon } from '../Icons/Icons';
import { ListCard } from '../ListCard/ListCard';
import { getCardLabels } from './package-card-helpers';
import { makeStyles } from '@material-ui/core/styles';
import { ListCardConfig, ListCardContent } from '../../types/types';

const useStyles = makeStyles({
  hiddenIcon: {
    visibility: 'hidden',
  },
});

interface PackageCardProps {
  cardContent: ListCardContent;
  packageCount?: number;
  cardConfig: ListCardConfig;
  onClick(): void;
  onIconClick?(): void;
  openResourcesIcon?: JSX.Element;
}

export function PackageCard(props: PackageCardProps): ReactElement | null {
  const classes = useStyles();
  const packageLabels = getCardLabels(props.cardContent);
  const leftIcon = props.onIconClick ? (
    <AddIcon
      className={props.cardConfig.isResolved ? classes.hiddenIcon : undefined}
      onClick={props.onIconClick}
      label={packageLabels[0] || ''}
      key={`add-icon-${props.cardContent.name}-${
        props.cardContent.packageVersion
      }-${packageLabels[0] || ''}`}
    />
  ) : undefined;

  const firstPartyIcon = props.cardConfig.firstParty ? (
    <FirstPartyIcon
      key={`first-party-icon-${props.cardContent.name}-${
        props.cardContent.packageVersion
      }-${packageLabels[0] || ''}`}
    />
  ) : undefined;
  const rightIcons: Array<JSX.Element> = [];
  if (props.openResourcesIcon) {
    rightIcons.push(props.openResourcesIcon);
  }
  if (firstPartyIcon) {
    rightIcons.push(firstPartyIcon);
  }

  return (
    <ListCard
      text={packageLabels[0] || ''}
      secondLineText={packageLabels[1] || undefined}
      cardConfig={props.cardConfig}
      count={props.packageCount}
      onClick={props.onClick}
      leftIcon={leftIcon}
      rightIcons={rightIcons}
    />
  );
}
