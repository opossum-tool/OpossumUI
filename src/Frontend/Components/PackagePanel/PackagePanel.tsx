// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  AttributionIdWithCount,
  Attributions,
  PackageInfo,
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
import { ListCardConfig } from '../../types/types';
import { PackagePanelCard } from '../PackagePanelCard/PackagePanelCard';

const classes = {
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
};

interface PackagePanelProps {
  attributionIdsWithCount: Array<AttributionIdWithCount>;
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
    const externalAttributionsForSelectedResource =
      resourcesToExternalAttributions[selectedResourceId] || [];

    return Object.entries(externalAttributions)
      .filter(
        ([attributionId, attribution]) =>
          externalAttributionsForSelectedResource.includes(attributionId) &&
          attribution?.preSelected
      )
      .map(([attributionId]) => attributionId);
  }

  function onCardClick(attributionId: string): void {
    dispatch(
      selectAttributionInAccordionPanelOrOpenUnsavedPopup(
        props.title,
        attributionId
      )
    );
  }

  function onAddAttributionClick(attributionId: string): void {
    switch (props.title) {
      case PackagePanelTitle.ExternalPackages:
      case PackagePanelTitle.ContainedExternalPackages:
        dispatch(addToSelectedResource(props.attributions[attributionId]));
        break;
      case PackagePanelTitle.ContainedManualPackages:
        dispatch(addToSelectedResource(props.attributions[attributionId]));
        break;
    }
  }

  function getPackagePanelCard(attributionId: string): ReactElement {
    const packageInfo: PackageInfo = props.attributions[attributionId];
    const packageCount = props.attributionIdsWithCount.filter(
      (attributionIdWithCount) =>
        attributionIdWithCount.attributionId === attributionId
    )[0].childrenWithAttributionCount;

    const isExternalAttribution =
      props.title === PackagePanelTitle.ExternalPackages ||
      props.title === PackagePanelTitle.ContainedExternalPackages;

    const isPreselected = isExternalAttribution
      ? getPreSelectedExternalAttributionIdsForSelectedResource().includes(
          attributionId
        )
      : packageInfo.preSelected;

    const selectedAttributionId =
      selectedPackage && props.title === selectedPackage.panel
        ? selectedPackage.attributionId
        : null;

    const cardConfig: ListCardConfig = {
      isSelected: attributionId === selectedAttributionId,
      isPreSelected: isPreselected,
      isResolved: resolvedExternalAttributionIds.has(attributionId),
      isExternalAttribution,
      firstParty: packageInfo.firstParty,
      excludeFromNotice: packageInfo.excludeFromNotice,
      followUp: Boolean(packageInfo.followUp),
      criticality: isExternalAttribution
        ? packageInfo.criticality
        : packageInfo.preSelected
        ? packageInfo.criticality
        : undefined,
    };

    function onIconClick(): void {
      onAddAttributionClick(attributionId);
    }

    return (
      <PackagePanelCard
        onClick={(): void => onCardClick(attributionId)}
        onIconClick={props.isAddToPackageEnabled ? onIconClick : undefined}
        key={`PackageCard-${packageInfo.packageName}-${attributionId}`}
        packageCount={packageCount}
        hideResourceSpecificButtons={true}
        cardContent={{
          id: `package-${selectedResourceId}-${attributionId}`,
          name: packageInfo.packageName,
          packageVersion: packageInfo.packageVersion,
          copyright: packageInfo.copyright,
          licenseText: packageInfo.licenseText,
          comment: packageInfo.comment,
          url: packageInfo.url,
          licenseName: packageInfo.licenseName,
          firstParty: packageInfo.firstParty,
        }}
        attributionId={attributionId}
        cardConfig={cardConfig}
      />
    );
  }

  const sortedSources = getSortedSources(
    props.attributions,
    props.attributionIdsWithCount,
    attributionSources
  );
  //prettifySource(sourceName, attributionSources)

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
            getAttributionCard={getPackagePanelCard}
            maxNumberOfDisplayedItems={15}
            listTitle={prettifySource(sourceName, attributionSources)}
          />
        </div>
      ))}
    </MuiBox>
  );
}
