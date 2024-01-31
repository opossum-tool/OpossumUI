// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { groupBy } from 'lodash';
import { ReactElement, useMemo } from 'react';

import { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PackagePanelTitle } from '../../enums/enums';
import { selectPackageCardInAuditViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getDisplayedPackage,
  getExternalAttributions,
  getExternalAttributionSources,
  getResourcesToExternalAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { PackageCardConfig } from '../../types/types';
import { prettifySource } from '../../util/prettify-source';
import { PackageCard } from '../PackageCard/PackageCard';
import { PackageList } from '../PackageList/PackageList';

const classes = {
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
};

interface PackagePanelProps {
  displayPackageInfos: Attributions;
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
        props.displayPackageInfos[packageCardId],
      ),
    );
  }

  function onAddAttributionClick(packageCardId: string): void {
    dispatch(addToSelectedResource(props.displayPackageInfos[packageCardId]));
  }

  function getPackageCard(packageCardId: string): ReactElement {
    const displayPackageInfo = props.displayPackageInfos[packageCardId];

    const packageCount = props.displayPackageInfos[packageCardId].count;

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
      isResolved: [displayPackageInfo.id].every((attributionId) =>
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
        packageInfo={displayPackageInfo}
        cardConfig={cardConfig}
        showOpenResourcesIcon={true}
      />
    );
  }

  const groups = useMemo(
    () =>
      groupBy(props.displayPackageInfos, ({ source }) =>
        source
          ? attributionSources[source.name]?.name || source.name
          : text.attributionList.unknownSource,
      ),
    [attributionSources, props.displayPackageInfos],
  );

  return (
    <MuiBox sx={classes.root}>
      {Object.entries(groups).map(([sourceName, displayPackageInfos]) => (
        <PackageList
          key={sourceName}
          displayPackageInfos={displayPackageInfos}
          getAttributionCard={getPackageCard}
          maxNumberOfDisplayedItems={15}
          listTitle={prettifySource(sourceName, attributionSources)}
        />
      ))}
    </MuiBox>
  );
}
