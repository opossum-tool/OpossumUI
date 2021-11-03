// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
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
import { ContextMenu, ContextMenuItem } from '../ContextMenu/ContextMenu';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { doNothing } from '../../util/do-nothing';
import { useSelector } from 'react-redux';
import {
  getManualAttributions,
  getManualAttributionsToResources,
  getTemporaryPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import {
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
  savePackageInfo,
  unlinkAttributionAndSavePackageInfo,
} from '../../state/actions/resource-actions/save-actions';
import { openPopupWithTargetAttributionId } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { ResourcePathPopup } from '../ResourcePathPopup/ResourcePathPopup';
import { getSelectedView } from '../../state/selectors/view-selector';
import { getSelectedAttributionId } from '../../state/selectors/attribution-view-resource-selectors';

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
  attributionId: string;
  packageCount?: number;
  cardConfig: ListCardConfig;
  onClick(): void;
  onIconClick?(): void;
  openResourcesIcon?: JSX.Element;
  hideContextMenu?: boolean;
  hideResourceSpecificButtons?: boolean;
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

  const attributionId = props.attributionId;
  const dispatch = useAppDispatch();
  const [showAssociatedResourcesPopup, setShowAssociatedResourcesPopup] =
    useState<boolean>(false);

  const temporaryPackageInfo = useSelector(getTemporaryPackageInfo);
  const selectedView = useSelector(getSelectedView);
  const selectedAttributionIdAttributionView = useSelector(
    getSelectedAttributionId
  );
  const selectedAttributionIdAuditView =
    useSelector(getAttributionIdOfDisplayedPackageInManualPanel) ?? '';

  const selectedAttributionId =
    selectedView === View.Attribution
      ? selectedAttributionIdAttributionView
      : selectedAttributionIdAuditView;

  const manualAttributions = useSelector(getManualAttributions);
  const selectedResourceId = useSelector(getSelectedResourceId);
  const attributionsToResources = useSelector(getManualAttributionsToResources);

  const hideResourceSpecificButtons = Boolean(
    props.hideResourceSpecificButtons
  );
  const isExternalAttribution = Boolean(props.cardConfig.isExternalAttribution);
  const isPreselected = Boolean(props.cardConfig.isPreSelected);
  const showGlobalButtons =
    !Boolean(isExternalAttribution) &&
    (hasAttributionMultipleResources(
      props.attributionId,
      attributionsToResources
    ) ||
      hideResourceSpecificButtons);

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
  if (isPreselected) {
    rightIcons.push(
      <PreSelectedIcon key={getKey('pre-selected-icon', props.cardContent)} />
    );
  }

  function openConfirmDeletionPopup(): void {
    if (isPreselected) {
      dispatch(deleteAttributionAndSave(selectedResourceId, attributionId));
    } else {
      dispatch(
        openPopupWithTargetAttributionId(
          PopupType.ConfirmDeletionPopup,
          attributionId
        )
      );
    }
  }

  function openConfirmDeletionGloballyPopup(): void {
    if (isPreselected) {
      dispatch(deleteAttributionGloballyAndSave(attributionId));
    } else {
      dispatch(
        openPopupWithTargetAttributionId(
          PopupType.ConfirmDeletionGloballyPopup,
          attributionId
        )
      );
    }
  }

  function confirmAttribution(): void {
    if (attributionId === selectedAttributionId) {
      dispatch(
        unlinkAttributionAndSavePackageInfo(
          selectedResourceId,
          attributionId,
          temporaryPackageInfo
        )
      );
    } else {
      dispatch(
        unlinkAttributionAndSavePackageInfo(
          selectedResourceId,
          attributionId,
          manualAttributions[attributionId]
        )
      );
    }
  }

  function confirmAttributionGlobally(): void {
    if (attributionId === selectedAttributionId) {
      dispatch(savePackageInfo(null, attributionId, temporaryPackageInfo));
    } else {
      dispatch(
        savePackageInfo(null, attributionId, manualAttributions[attributionId])
      );
    }
  }

  const contextMenuItems: Array<ContextMenuItem> = props.hideContextMenu
    ? []
    : [
        {
          buttonText: ButtonText.Delete,
          onClick: openConfirmDeletionPopup,
          hidden: isExternalAttribution || hideResourceSpecificButtons,
        },
        {
          buttonText: ButtonText.DeleteGlobally,
          onClick: openConfirmDeletionGloballyPopup,
          hidden: isExternalAttribution || !showGlobalButtons,
        },
        {
          buttonText: ButtonText.Confirm,
          onClick: confirmAttribution,
          hidden:
            !isPreselected ||
            isExternalAttribution ||
            hideResourceSpecificButtons,
        },
        {
          buttonText: ButtonText.ConfirmGlobally,
          onClick: confirmAttributionGlobally,
          hidden: !isPreselected || !showGlobalButtons,
        },
        {
          buttonText: ButtonText.ShowResources,
          onClick: (): void => setShowAssociatedResourcesPopup(true),
        },
        {
          buttonText: ButtonText.Hide,
          onClick: doNothing,
          hidden: !isExternalAttribution,
        },
      ];

  return (
    <>
      {!Boolean(props.hideContextMenu) && (
        <ResourcePathPopup
          isOpen={showAssociatedResourcesPopup}
          closePopup={(): void => setShowAssociatedResourcesPopup(false)}
          attributionId={props.attributionId}
          isExternalAttribution={Boolean(
            props.cardConfig.isExternalAttribution
          )}
          displayedAttributionName={getCardLabels(props.cardContent)[0] || ''}
        />
      )}
      <ContextMenu menuItems={contextMenuItems} activation={'onRightClick'}>
        <ListCard
          text={packageLabels[0] || ''}
          secondLineText={packageLabels[1] || undefined}
          cardConfig={props.cardConfig}
          count={props.packageCount}
          onClick={props.onClick}
          leftIcon={leftIcon}
          rightIcons={rightIcons}
        />
      </ContextMenu>
    </>
  );
}
