// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { DisplayPackageInfo } from '../../../shared/shared-types';
import { List } from '../List/List';
import { PackageCard } from '../PackageCard/PackageCard';
import {
  DisplayAttributionWithCount,
  PackageCardConfig,
} from '../../types/types';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
} from '../../shared-constants';
import { getAttributionFromDisplayAttributionsWithCount } from '../../util/get-attribution-from-display-attributions-with-count';

const DISPLAY_PACKAGE_INFO_FOR_ADD_NEW_ATTRIBUTION_BUTTON: DisplayPackageInfo =
  {
    packageName: ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
    attributionIds: [''],
  };

interface ManualAttributionListProps {
  sortedDisplayAttributionsWithCount: Array<DisplayAttributionWithCount>;
  selectedResourceId: string;
  selectedAttributionId: string | null;
  onCardClick(attributionId: string, isButton?: boolean): void;
  isAddNewAttributionItemShown?: boolean;
  attributionsFromParent?: boolean;
}

export function ManualAttributionList(
  props: ManualAttributionListProps
): ReactElement {
  const attributionIds: Array<string> =
    props.sortedDisplayAttributionsWithCount.map(
      ({ attributionId }) => attributionId
    );

  if (props.isAddNewAttributionItemShown) {
    attributionIds.push(ADD_NEW_ATTRIBUTION_BUTTON_ID);
  }

  function getAttributionCard(attributionId: string): ReactElement {
    const isButton = attributionId === ADD_NEW_ATTRIBUTION_BUTTON_ID;

    const displayPackageInfo: DisplayPackageInfo = isButton
      ? DISPLAY_PACKAGE_INFO_FOR_ADD_NEW_ATTRIBUTION_BUTTON
      : getAttributionFromDisplayAttributionsWithCount(
          attributionId,
          props.sortedDisplayAttributionsWithCount
        );

    function isSelected(): boolean {
      return (
        attributionId === props.selectedAttributionId ||
        Boolean(props.selectedAttributionId === '' && isButton)
      );
    }

    function onClick(): void {
      props.onCardClick(attributionId, isButton);
    }

    const cardConfig: PackageCardConfig = {
      isSelected: isSelected(),
      isPreSelected: Boolean(displayPackageInfo.preSelected),
    };

    return (
      <PackageCard
        onClick={onClick}
        hideContextMenuAndMultiSelect={isButton}
        cardConfig={cardConfig}
        key={`AttributionCard-${displayPackageInfo.packageName}-${attributionId}`}
        cardId={`manual-${props.selectedResourceId}-${attributionId}`}
        displayPackageInfo={displayPackageInfo}
        showOpenResourcesIcon={!isButton}
        hideAttributionWizardContextMenuItem={props.attributionsFromParent}
      />
    );
  }

  return (
    <List
      getListItem={(index: number): ReactElement =>
        getAttributionCard(attributionIds[index])
      }
      length={attributionIds.length}
      max={{ numberOfDisplayedItems: 5 }}
      cardVerticalDistance={41}
    />
  );
}
