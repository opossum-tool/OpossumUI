// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography/Typography';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AttributionIdWithCount,
  Attributions,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { selectAttributionInAccordionPanelOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import {
  addManualAttributionToSelectedResource,
  addSignalToSelectedResource,
} from '../../state/actions/resource-actions/save-actions';
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

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

interface PackagePanelProps {
  attributionIdsWithCount: Array<AttributionIdWithCount>;
  title: PackagePanelTitle;
  attributions: Attributions;
  isAddToPackageEnabled: boolean;
}

export function PackagePanel(
  props: PackagePanelProps
): React.ReactElement | null {
  const classes = useStyles();
  const selectedPackage = useSelector(getDisplayedPackage);
  const resolvedExternalAttributionIds = useSelector(
    getResolvedExternalAttributions
  );
  const selectedResourceId = useSelector(getSelectedResourceId);
  const externalAttributions = useSelector(getExternalAttributions);
  const resourcesToExternalAttributions = useSelector(
    getResourcesToExternalAttributions
  );
  const attributionSources = useSelector(getExternalAttributionSources);
  const dispatch = useDispatch();

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
  const preSelectedExternalAttributionIdsForSelectedResource =
    getPreSelectedExternalAttributionIdsForSelectedResource();

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
        dispatch(
          addSignalToSelectedResource(props.attributions[attributionId])
        );
        break;
      case PackagePanelTitle.ContainedManualPackages:
        dispatch(
          addManualAttributionToSelectedResource(
            props.attributions[attributionId]
          )
        );
        break;
    }
  }

  const sortedSources = getSortedSources(
    props.attributions,
    props.attributionIdsWithCount,
    attributionSources
  );

  return (
    <div className={classes.root}>
      {sortedSources.map((sourceName) => (
        <div key={`PackageListForSource-${sourceName}`}>
          {sourceName ? (
            <MuiTypography variant={'body2'}>
              {prettifySource(sourceName, attributionSources)}
            </MuiTypography>
          ) : null}
          <PackageList
            attributionIdsWithCount={getAttributionIdsWithCountForSource(
              props.attributionIdsWithCount,
              props.attributions,
              sourceName
            )}
            attributions={props.attributions}
            preSelectedExternalAttributionIdsForSelectedResource={
              preSelectedExternalAttributionIdsForSelectedResource
            }
            selectedAttributionId={
              selectedPackage && props.title === selectedPackage.panel
                ? selectedPackage.attributionId
                : null
            }
            resolvedAttributionIds={resolvedExternalAttributionIds}
            onCardClick={onCardClick}
            onAddAttributionClick={(attributionId): void =>
              onAddAttributionClick(attributionId)
            }
            sorted={props.title === PackagePanelTitle.ContainedManualPackages}
            isExternalAttribution={
              props.title === PackagePanelTitle.ExternalPackages ||
              props.title === PackagePanelTitle.ContainedExternalPackages
            }
            isAddToPackageEnabled={props.isAddToPackageEnabled}
            selectedResourceId={selectedResourceId}
          />
        </div>
      ))}
    </div>
  );
}
