// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
} from '../../shared-constants';
import { PackageCardConfig } from '../../types/types';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT, PackageCard } from '../PackageCard/PackageCard';

const DISPLAY_PACKAGE_INFO_FOR_ADD_NEW_ATTRIBUTION_BUTTON: PackageInfo = {
  id: ADD_NEW_ATTRIBUTION_BUTTON_ID,
  packageName: ADD_NEW_ATTRIBUTION_BUTTON_TEXT,
};

interface ManualAttributionListProps {
  displayPackageInfos: Attributions;
  selectedResourceId: string;
  selectedPackageCardId?: string;
  onCardClick(packageCardId: string, isButton?: boolean): void;
  isAddNewAttributionItemShown?: boolean;
}

export function ManualAttributionList(
  props: ManualAttributionListProps,
): ReactElement {
  const sortedPackageCardIds = Object.keys(props.displayPackageInfos);
  const sortedPackageCardIdsPotentiallyWithAddNewAttributionButton =
    props.isAddNewAttributionItemShown
      ? [...sortedPackageCardIds, ADD_NEW_ATTRIBUTION_BUTTON_ID]
      : sortedPackageCardIds;

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
        cardConfig={cardConfig}
        key={`AttributionCard-${displayPackageInfo.packageName}-${packageCardId}`}
        packageInfo={displayPackageInfo}
        showOpenResourcesIcon={!isButton}
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
