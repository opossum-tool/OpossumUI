// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  AttributionIdWithCount,
  Attributions,
  PackageInfo,
} from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { List } from '../List/List';
import { PackagePanelCard } from '../PackagePanelCard/PackagePanelCard';
import { ListCardConfig } from '../../types/types';
import { makeStyles } from '@mui/styles';
import clsx from 'clsx';

const NUMBER_OF_DISPLAYED_ITEMS = 15;
const CARD_VERTICAL_DISTANCE = 41;
const MAX_HEIGHT = NUMBER_OF_DISPLAYED_ITEMS * CARD_VERTICAL_DISTANCE;
const TYPICAL_SCROLLBAR_WIDTH = 13;

const useStyles = makeStyles({
  paddingRight: {
    paddingRight: TYPICAL_SCROLLBAR_WIDTH,
  },
});

interface PackageListProps {
  attributionIdsWithCount?: Array<AttributionIdWithCount>;
  attributions: Attributions;
  selectedAttributionId: string | null;
  resolvedAttributionIds: Set<string>;
  onCardClick(attributionId: string): void;
  onAddAttributionClick(attributionId: string): void;
  sorted?: boolean;
  isExternalAttribution: boolean;
  preSelectedExternalAttributionIdsForSelectedResource: Array<string>;
  isAddToPackageEnabled: boolean;
  selectedResourceId: string;
}

export function PackageList(props: PackageListProps): ReactElement {
  const attributionIdsWithCount = props.attributionIdsWithCount || [];

  const classes = useStyles();

  function getSortedAttributionIds(): Array<string> {
    if (!attributionIdsWithCount.length) {
      return [];
    }

    const attributionIds = attributionIdsWithCount.map(
      (attributionIdWithCount) => attributionIdWithCount.attributionId
    );

    return props.sorted
      ? attributionIds.sort(getAlphabeticalComparer(props.attributions))
      : attributionIds;
  }

  const sortedAttributionIds = getSortedAttributionIds();

  function getPackagePanelCard(index: number): ReactElement {
    const attributionId: string = sortedAttributionIds[index];
    const packageInfo: PackageInfo = props.attributions[attributionId];
    const packageCount = attributionIdsWithCount.filter(
      (attributionIdWithCount) =>
        attributionIdWithCount.attributionId === attributionId
    )[0].childrenWithAttributionCount;
    const isPreselected = props.isExternalAttribution
      ? props.preSelectedExternalAttributionIdsForSelectedResource.includes(
          attributionId
        )
      : packageInfo.preSelected;

    const cardConfig: ListCardConfig = {
      isSelected: attributionId === props.selectedAttributionId,
      isPreSelected: isPreselected,
      isResolved: props.resolvedAttributionIds.has(attributionId),
      isExternalAttribution: props.isExternalAttribution,
      firstParty: packageInfo.firstParty,
      excludeFromNotice: packageInfo.excludeFromNotice,
      followUp: Boolean(packageInfo.followUp),
      criticality: props.isExternalAttribution
        ? packageInfo.criticality
        : packageInfo.preSelected
        ? packageInfo.criticality
        : undefined,
    };

    function onIconClick(): void {
      props.onAddAttributionClick(attributionId);
    }

    return (
      <PackagePanelCard
        onClick={(): void => props.onCardClick(attributionId)}
        onIconClick={props.isAddToPackageEnabled ? onIconClick : undefined}
        key={`PackageCard-${packageInfo.packageName}-${index}`}
        packageCount={packageCount}
        hideResourceSpecificButtons={true}
        cardContent={{
          id: `package-${props.selectedResourceId}-${attributionId}`,
          name: packageInfo.packageName,
          packageVersion: packageInfo.packageVersion,
          copyright: packageInfo.copyright,
          licenseText: packageInfo.licenseText,
          comment: packageInfo.comment,
          url: packageInfo.url,
          licenseName: packageInfo.licenseName,
        }}
        attributionId={attributionId}
        cardConfig={cardConfig}
      />
    );
  }

  const currentHeight = attributionIdsWithCount.length * CARD_VERTICAL_DISTANCE;

  return (
    <List
      getListItem={getPackagePanelCard}
      max={{ numberOfDisplayedItems: NUMBER_OF_DISPLAYED_ITEMS }}
      length={attributionIdsWithCount.length}
      cardVerticalDistance={CARD_VERTICAL_DISTANCE}
      className={clsx(currentHeight < MAX_HEIGHT && classes.paddingRight)}
    />
  );
}
