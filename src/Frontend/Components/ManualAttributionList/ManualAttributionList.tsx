// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { List } from '../List/List';
import { PackageCard } from '../PackageCard/PackageCard';
import { ListCardConfig } from '../../types/types';

const addNewAttributionButtonTitle = 'Add new attribution';
const addNewAttributionButtonId = 'ADD_NEW_ATTRIBUTION_ID';

interface ManualAttributionListProps {
  attributions: Attributions;
  selectedAttributionId: string | null;
  onCardClick(attributionId: string, isButton?: boolean): void;
  isAddNewAttributionItemShown?: boolean;
}

export function ManualAttributionList(
  props: ManualAttributionListProps
): ReactElement {
  const attributions = { ...props.attributions };
  const attributionIds: Array<string> = Object.keys({
    ...props.attributions,
  }).sort(getAlphabeticalComparer(attributions));

  if (props.isAddNewAttributionItemShown) {
    attributions[addNewAttributionButtonId] = {
      packageName: addNewAttributionButtonTitle,
    };
    attributionIds.push(addNewAttributionButtonId);
  }

  function getAttributionCard(attributionId: string): ReactElement {
    const attribution = attributions[attributionId];

    function isSelected(): boolean {
      return (
        attributionId === props.selectedAttributionId ||
        Boolean(
          props.selectedAttributionId === '' &&
            attributionId === addNewAttributionButtonId
        )
      );
    }

    function onClick(): void {
      props.onCardClick(
        attributionId,
        attributionId === addNewAttributionButtonId
      );
    }

    const cardConfig: ListCardConfig = {
      isSelected: isSelected(),
      isPreSelected: Boolean(attribution.preSelected),
      firstParty: attribution.firstParty,
      excludeFromNotice: attribution.excludeFromNotice,
      followUp: Boolean(attribution.followUp),
    };

    return (
      <PackageCard
        onClick={onClick}
        cardConfig={cardConfig}
        key={`AttributionCard-${attribution.packageName}-${attributionId}`}
        cardContent={{
          name: attribution.packageName,
          packageVersion: attribution.packageVersion,
          copyright: attribution.copyright,
          licenseText: attribution.licenseText,
          comment: attribution.comment,
          url: attribution.url,
          licenseName: attribution.licenseName,
        }}
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
