// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  Attributions,
  DisplayPackageInfo,
  PackageInfo,
  isDisplayPackageInfo,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { selectAttributionInAccordionPanelOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import {
  getDisplayedPackage,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { PackageList } from '../PackageList/PackageList';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getResourcesToExternalAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionIdsWithCountForSource,
  getSortedSources,
} from './package-panel-helpers';
import { prettifySource } from '../../util/prettify-source';
import {
  AttributionIdWithCount,
  isDisplayAttributionWithCount,
  DisplayAttributionWithCount,
  PackageCardConfig,
} from '../../types/types';
import { PackageCard } from '../PackageCard/PackageCard';
import {
  convertDisplayPackageInfoToPackageInfo,
  convertPackageInfoToDisplayPackageInfo,
} from '../../util/convert-package-info';

const classes = {
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
};

interface PackagePanelProps {
  attributionIdsWithCount: Array<
    AttributionIdWithCount | DisplayAttributionWithCount
  >;
  title: PackagePanelTitle;
  attributions: Attributions;
  isAddToPackageEnabled: boolean;
}

export function PackagePanel(
  props: PackagePanelProps
): React.ReactElement | null {
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const resolvedExternalAttributionIds = useAppSelector(
    getResolvedExternalAttributions
  );
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions
  );
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const dispatch = useAppDispatch();

  function getPreSelectedExternalAttributionIdsForSelectedResource(): Array<string> {
    const externalAttributionIdsForSelectedResource =
      resourcesToExternalAttributions[selectedResourceId] || [];

    const externalPreselectedAttributionIds: Array<string> = [];
    externalAttributionIdsForSelectedResource.forEach((attributionId) => {
      const externalAttribution = externalAttributions[attributionId];

      if (externalAttribution?.preSelected) {
        externalPreselectedAttributionIds.push(attributionId);
      }
    });

    return externalPreselectedAttributionIds;
  }

  function onCardClick(attributionId: string): void {
    dispatch(
      selectAttributionInAccordionPanelOrOpenUnsavedPopup(
        props.title,
        attributionId,
        getAttributionFromDisplayAttributionWithCount(attributionId)
      )
    );
  }

  function getAttributionFromDisplayAttributionWithCount(
    attributionId: string
  ): DisplayPackageInfo | undefined {
    const attributionIdOrDisplayAttributionWithCount:
      | AttributionIdWithCount
      | DisplayAttributionWithCount
      | undefined = props.attributionIdsWithCount.find(
      (attributionIdWithCount) =>
        attributionIdWithCount.attributionId === attributionId
    );

    if (
      attributionIdOrDisplayAttributionWithCount &&
      isDisplayAttributionWithCount(attributionIdOrDisplayAttributionWithCount)
    ) {
      return attributionIdOrDisplayAttributionWithCount.attribution;
    } else {
      return undefined;
    }
  }

  function onAddAttributionClick(attributionId: string): void {
    switch (props.title) {
      case PackagePanelTitle.ExternalPackages:
      case PackagePanelTitle.ContainedExternalPackages:
        const packageInfo: PackageInfo | DisplayPackageInfo =
          getAttributionFromDisplayAttributionWithCount(attributionId) ||
          props.attributions[attributionId];

        const packageInfoToAdd = isDisplayPackageInfo(packageInfo)
          ? convertDisplayPackageInfoToPackageInfo(packageInfo)
          : packageInfo;

        dispatch(addToSelectedResource(packageInfoToAdd));
        break;
      case PackagePanelTitle.ContainedManualPackages:
        dispatch(addToSelectedResource(props.attributions[attributionId]));
        break;
    }
  }

  function getPackageCard(attributionId: string): ReactElement {
    const displayPackageInfo: DisplayPackageInfo =
      getAttributionFromDisplayAttributionWithCount(attributionId) ??
      convertPackageInfoToDisplayPackageInfo(
        props.attributions[attributionId],
        [attributionId]
      );

    const packageCount: number | undefined =
      props.attributionIdsWithCount.filter(
        (attributionIdWithCount) =>
          attributionIdWithCount.attributionId === attributionId
      )[0].count;

    const isExternalAttribution =
      props.title === PackagePanelTitle.ExternalPackages ||
      props.title === PackagePanelTitle.ContainedExternalPackages;

    const isPreselected = isExternalAttribution
      ? getPreSelectedExternalAttributionIdsForSelectedResource().includes(
          attributionId
        )
      : displayPackageInfo.preSelected;

    const selectedAttributionId =
      selectedPackage && props.title === selectedPackage.panel
        ? selectedPackage.attributionId
        : null;

    const cardConfig: PackageCardConfig = {
      isSelected: attributionId === selectedAttributionId,
      isPreSelected: isPreselected,
      isResolved: resolvedExternalAttributionIds.has(attributionId),
      isExternalAttribution,
    };

    function onIconClick(): void {
      onAddAttributionClick(attributionId);
    }

    return (
      <PackageCard
        onClick={(): void => onCardClick(attributionId)}
        onIconClick={props.isAddToPackageEnabled ? onIconClick : undefined}
        key={`PackageCard-${displayPackageInfo.packageName}-${attributionId}`}
        packageCount={packageCount}
        hideResourceSpecificButtons={true}
        cardId={`package-${selectedResourceId}-${attributionId}`}
        displayPackageInfo={displayPackageInfo}
        cardConfig={cardConfig}
        showOpenResourcesIcon={true}
      />
    );
  }

  const sortedSources = getSortedSources(
    props.attributions,
    props.attributionIdsWithCount,
    attributionSources
  );

  return (
    <MuiBox sx={classes.root}>
      {sortedSources.map((sourceName) => (
        <div key={`PackageListForSource-${sourceName}`}>
          <PackageList
            attributions={props.attributions}
            attributionIds={getAttributionIdsWithCountForSource(
              props.attributionIdsWithCount,
              props.attributions,
              sourceName
            ).map(
              (attributionIdWithCount) => attributionIdWithCount.attributionId
            )}
            getAttributionCard={getPackageCard}
            maxNumberOfDisplayedItems={15}
            listTitle={prettifySource(sourceName, attributionSources)}
          />
        </div>
      ))}
    </MuiBox>
  );
}
