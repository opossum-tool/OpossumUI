// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useMemo } from 'react';
import { PackagePanelTitle } from '../../enums/enums';
import { WorkerAccordionPanel } from './WorkerAccordionPanel';
import { useAppSelector } from '../../state/hooks';
import {
  getExternalAttributionsToHashes,
  getExternalData,
  getManualData,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { isIdOfResourceWithChildren } from '../../util/can-resource-have-children';
import { SyncAccordionPanel } from './SyncAccordionPanel';
import {
  getExternalAttributionIdsWithCount,
  PanelAttributionData,
} from '../../util/get-contained-packages';
import { AttributionIdWithCount } from '../../types/types';
import {
  getDisplayContainedExternalPackagesWithCount,
  getDisplayContainedManualPackagesWithCount,
} from './accordion-panel-helpers';

interface AggregatedAttributionsPanelProps {
  isAddToPackageEnabled: boolean;
}

export function AggregatedAttributionsPanel(
  props: AggregatedAttributionsPanelProps
): ReactElement {
  const manualData = useAppSelector(getManualData);
  const externalData = useAppSelector(getExternalData);
  const attributionsToHashes = useAppSelector(getExternalAttributionsToHashes);

  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const resolvedExternalAttributions: Set<string> = useAppSelector(
    getResolvedExternalAttributions
  );

  const containedExternalPackagesWorkerArgs = useMemo(
    () => ({
      selectedResourceId,
      resolvedExternalAttributions,
    }),
    [selectedResourceId, resolvedExternalAttributions]
  );
  const containedExternalPackagesSyncFallbackArgs = useMemo(
    () => ({
      selectedResourceId,
      externalData,
      resolvedExternalAttributions,
      attributionsToHashes,
    }),
    [
      selectedResourceId,
      externalData,
      resolvedExternalAttributions,
      attributionsToHashes,
    ]
  );

  const manualPanelData: PanelAttributionData = {
    attributions: manualData.attributions,
    resourcesToAttributions: manualData.resourcesToAttributions,
    resourcesWithAttributedChildren: manualData.resourcesWithAttributedChildren,
  };
  const containedManualPackagesWorkerArgs = useMemo(
    () => ({
      selectedResourceId,
      manualData: manualPanelData,
    }),

    //  manualData is excluded from dependencies on purpose to avoid recalculation
    //  when it changes. Usually this is not an issue as the displayed data
    //  remains correct. Therefore, the panelData is eventually consistent.
    //  We still need manualData.resourcesToAttributions in the dependencies to
    //  update panelData, when replaceAttributionPopup was called. This is
    //  relevant for manual attributions in the attributions in folder content panel.

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedResourceId, manualData.resourcesToAttributions]
  );

  return (
    <>
      <SyncAccordionPanel
        title={PackagePanelTitle.ExternalPackages}
        getAttributionIdsWithCount={(): Array<AttributionIdWithCount> =>
          getExternalAttributionIdsWithCount(
            externalData.resourcesToAttributions[selectedResourceId] || []
          )
        }
        attributions={externalData.attributions}
        attributionsToHashes={attributionsToHashes}
        isAddToPackageEnabled={props.isAddToPackageEnabled}
      />
      {isIdOfResourceWithChildren(selectedResourceId) ? (
        <>
          <WorkerAccordionPanel
            title={PackagePanelTitle.ContainedExternalPackages}
            workerArgs={containedExternalPackagesWorkerArgs}
            syncFallbackArgs={containedExternalPackagesSyncFallbackArgs}
            getDisplayAttributionsWithCount={
              getDisplayContainedExternalPackagesWithCount
            }
            isAddToPackageEnabled={props.isAddToPackageEnabled}
          />
          <WorkerAccordionPanel
            title={PackagePanelTitle.ContainedManualPackages}
            workerArgs={containedManualPackagesWorkerArgs}
            getDisplayAttributionsWithCount={
              getDisplayContainedManualPackagesWithCount
            }
            isAddToPackageEnabled={props.isAddToPackageEnabled}
          />
        </>
      ) : null}
    </>
  );
}
