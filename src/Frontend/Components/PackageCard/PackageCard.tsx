// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  AddIcon,
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import { ListCard } from '../ListCard/ListCard';
import { getCardLabels } from './package-card-helpers';
import { makeStyles } from '@material-ui/core/styles';
import { ListCardConfig, ListCardContent } from '../../types/types';
import { OpossumColors } from '../../shared-styles';
import {
  ContextMenuItem,
  WithContextMenu,
} from '../ContextMenu/WithContextMenu';
import { ButtonText } from '../../enums/enums';
import { doNothing } from '../../util/do-nothing';
import { useSelector } from 'react-redux';
import { getManualAttributionsToResources } from '../../state/selectors/all-views-resource-selectors';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';

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
});

interface PackageCardProps {
  cardContent: ListCardContent;
  attributionId: string;
  packageCount?: number;
  cardConfig: ListCardConfig;
  onClick(): void;
  onIconClick?(): void;
  openResourcesIcon?: JSX.Element;
  hideContextMenu?: boolean;
}

function getKey(prefix: string, cardContent: ListCardContent): string {
  return `${prefix}-${cardContent.id}`;
}

export function PackageCard(props: PackageCardProps): ReactElement | null {
  const classes = useStyles();
  const packageLabels = getCardLabels(props.cardContent);
  const leftIcon = props.onIconClick ? (
    <AddIcon
      className={props.cardConfig.isResolved ? classes.hiddenIcon : undefined}
      onClick={props.onIconClick}
      label={packageLabels[0] || ''}
      key={getKey('add-icon', props.cardContent)}
    />
  ) : undefined;

  const isExternalAttribution = Boolean(props.cardConfig.isExternalAttribution);
  const isPreselected = Boolean(props.cardConfig.isPreSelected);
  const attributionsToResources = useSelector(getManualAttributionsToResources);

  const showGlobalButtons =
    !Boolean(isExternalAttribution) &&
    hasAttributionMultipleResources(
      props.attributionId,
      attributionsToResources
    );

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

  const contextMenuItems: Array<ContextMenuItem> =
    props.hideContextMenu || !props.attributionId
      ? []
      : [
          {
            buttonText: ButtonText.Delete,
            onClick: doNothing,
            hidden: isExternalAttribution,
          },
          {
            buttonText: ButtonText.DeleteGlobally,
            onClick: doNothing,
            hidden: isExternalAttribution || !showGlobalButtons,
          },
          {
            buttonText: ButtonText.Confirm,
            onClick: doNothing,
            hidden: !isPreselected || isExternalAttribution,
          },
          {
            buttonText: ButtonText.ConfirmGlobally,
            onClick: doNothing,
            hidden: !isPreselected || !showGlobalButtons,
          },
          {
            buttonText: ButtonText.ShowResources,
            onClick: doNothing,
          },
          {
            buttonText: ButtonText.Hide,
            onClick: doNothing,
            hidden: !isExternalAttribution,
          },
        ];

  return (
    <WithContextMenu menuItems={contextMenuItems} activation={'onRightClick'}>
      <ListCard
        text={packageLabels[0] || ''}
        secondLineText={packageLabels[1] || undefined}
        cardConfig={props.cardConfig}
        count={props.packageCount}
        onClick={props.onClick}
        leftIcon={leftIcon}
        rightIcons={rightIcons}
      />
    </WithContextMenu>
  );
}
