// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../shared-constants';
import { DisplayPackageInfos, PackageCardConfig } from '../../types/types';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT, PackageCard } from '../PackageCard/PackageCard';

const DISPLAY_PACKAGE_INFO_FOR_ADD_NEW_ATTRIBUTION_BUTTON: DisplayPackageInfo =
  {
    ...EMPTY_DISPLAY_PACKAGE_INFO,
    packageName: ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
  };

interface ManualAttributionListProps {
  displayPackageInfos: DisplayPackageInfos;
  sortedPackageCardIds: Array<string>;
  selectedResourceId: string;
  selectedPackageCardId?: string;
  onCardClick(packageCardId: string, isButton?: boolean): void;
  isAddNewAttributionItemShown?: boolean;
  attributionsFromParent?: boolean;
}

export function ManualAttributionList(
  props: ManualAttributionListProps,
): ReactElement {
  const sortedPackageCardIdsPotentiallyWithAddNewAttributionButton =
    props.isAddNewAttributionItemShown
      ? [...props.sortedPackageCardIds, ADD_NEW_ATTRIBUTION_BUTTON_ID]
      : props.sortedPackageCardIds;

  function getAttributionCard(packageCardId: string): ReactElement {
    const isButton = packageCardId === ADD_NEW_ATTRIBUTION_BUTTON_ID;

    const displayPackageInfo = isButton
      ? DISPLAY_PACKAGE_INFO_FOR_ADD_NEW_ATTRIBUTION_BUTTON
      : props.displayPackageInfos[packageCardId];

    function onClick(): void {
      props.onCardClick(packageCardId, isButton);
    }

    const cardConfig: PackageCardConfig = {
      isSelected: packageCardId === props.selectedPackageCardId,
      isPreSelected: Boolean(displayPackageInfo.preSelected),
    };

    return (
      <PackageCard
        onClick={onClick}
        hideContextMenuAndMultiSelect={isButton}
        cardConfig={cardConfig}
        key={`AttributionCard-${displayPackageInfo.packageName}-${packageCardId}`}
        cardId={`manual-${props.selectedResourceId}-${packageCardId}`}
        displayPackageInfo={displayPackageInfo}
        showOpenResourcesIcon={!isButton}
        hideAttributionWizardContextMenuItem={props.attributionsFromParent}
      />
    );
  }

  return (
    <List
      getListItem={(index: number): ReactElement =>
        getAttributionCard(
          sortedPackageCardIdsPotentiallyWithAddNewAttributionButton[index],
        )
      }
      length={sortedPackageCardIdsPotentiallyWithAddNewAttributionButton.length}
      maxNumberOfItems={5}
      cardHeight={PACKAGE_CARD_HEIGHT}
    />
  );
}
