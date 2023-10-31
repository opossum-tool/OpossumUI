// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import { ReactElement, Fragment } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { PackagePanelTitle } from '../../enums/enums';
import { selectPackageCardInAuditViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
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
  getPackageCardIdsAndDisplayPackageInfosForSource,
  getSortedSourcesFromDisplayPackageInfosWithCount,
} from './package-panel-helpers';
import { prettifySource } from '../../util/prettify-source';
import {
  DisplayPackageInfosWithCount,
  PackageCardConfig,
} from '../../types/types';
import { PackageCard } from '../PackageCard/PackageCard';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';

const classes = {
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
};

interface PackagePanelProps {
  displayPackageInfosWithCount: DisplayPackageInfosWithCount;
  sortedPackageCardIds: Array<string>;
  title: PackagePanelTitle;
  isAddToPackageEnabled: boolean;
}

export function PackagePanel(
  props: PackagePanelProps,
): React.ReactElement | null {
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const resolvedExternalAttributionIds = useAppSelector(
    getResolvedExternalAttributions,
  );
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions,
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

  function onCardClick(packageCardId: string): void {
    dispatch(
      selectPackageCardInAuditViewOrOpenUnsavedPopup(
        props.title,
        packageCardId,
        props.displayPackageInfosWithCount[packageCardId].displayPackageInfo,
      ),
    );
  }

  function onAddAttributionClick(packageCardId: string): void {
    const displayPackageInfo =
      props.displayPackageInfosWithCount[packageCardId].displayPackageInfo;
    const packageInfoToAdd =
      convertDisplayPackageInfoToPackageInfo(displayPackageInfo);

    dispatch(addToSelectedResource(packageInfoToAdd));
  }

  function getPackageCard(packageCardId: string): ReactElement {
    const displayPackageInfo =
      props.displayPackageInfosWithCount[packageCardId].displayPackageInfo;

    const packageCount =
      props.displayPackageInfosWithCount[packageCardId].count;

    const isExternalAttribution =
      props.title === PackagePanelTitle.ExternalPackages ||
      props.title === PackagePanelTitle.ContainedExternalPackages;

    const isPreselected = isExternalAttribution
      ? getPreSelectedExternalAttributionIdsForSelectedResource().includes(
          packageCardId,
        )
      : displayPackageInfo.preSelected;

    const selectedPackageCardId =
      selectedPackage && props.title === selectedPackage.panel
        ? selectedPackage.packageCardId
        : null;

    const cardConfig: PackageCardConfig = {
      isSelected: packageCardId === selectedPackageCardId,
      isPreSelected: isPreselected,
      isResolved: displayPackageInfo.attributionIds.every((attributionId) =>
        resolvedExternalAttributionIds.has(attributionId),
      ),
      isExternalAttribution,
    };

    function onIconClick(): void {
      onAddAttributionClick(packageCardId);
    }

    return (
      <PackageCard
        onClick={(): void => onCardClick(packageCardId)}
        onIconClick={props.isAddToPackageEnabled ? onIconClick : undefined}
        key={`PackageCard-${displayPackageInfo.packageName}-${packageCardId}`}
        packageCount={packageCount}
        hideResourceSpecificButtons={true}
        cardId={`package-${selectedResourceId}-${packageCardId}`}
        displayPackageInfo={displayPackageInfo}
        cardConfig={cardConfig}
        showOpenResourcesIcon={true}
      />
    );
  }

  const sortedSources = getSortedSourcesFromDisplayPackageInfosWithCount(
    props.displayPackageInfosWithCount,
    attributionSources,
  );

  function getPackageListForSource(sourceName: string | null): ReactElement {
    const [sortedPackageCardIdsForSource, displayPackageInfosForSource] =
      getPackageCardIdsAndDisplayPackageInfosForSource(
        props.displayPackageInfosWithCount,
        props.sortedPackageCardIds,
        sourceName,
      );

    return (
      <PackageList
        displayPackageInfos={displayPackageInfosForSource}
        sortedPackageCardIds={sortedPackageCardIdsForSource}
        getAttributionCard={getPackageCard}
        maxNumberOfDisplayedItems={15}
        listTitle={prettifySource(sourceName, attributionSources)}
      />
    );
  }

  return (
    <MuiBox sx={classes.root}>
      {sortedSources.map((sourceName) => (
        <Fragment key={`PackageListForSource-${sourceName}`}>
          {getPackageListForSource(sourceName)}
        </Fragment>
      ))}
    </MuiBox>
  );
}
