// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement, memo, useMemo } from 'react';
import { PackagePanelTitle } from '../../enums/enums';
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
import { AttributionIdWithCount } from '../../types/types';
import { isIdOfResourceWithChildren } from '../../util/can-resource-have-children';
import {
  PanelAttributionData,
  getExternalAttributionIdsWithCount,
} from '../../util/get-contained-packages';
import { SyncAccordionPanel } from './SyncAccordionPanel';
import { WorkerAccordionPanel } from './WorkerAccordionPanel';
import {
  getContainedExternalDisplayPackageInfosWithCount,
  getContainedManualDisplayPackageInfosWithCount,
} from './accordion-panel-helpers';

interface AggregatedAttributionsPanelProps {
  isAddToPackageEnabled: boolean;
}

export const AggregatedAttributionsPanel = memo(
  function AggregatedAttributionsPanel(
    props: AggregatedAttributionsPanelProps,
  ): ReactElement {
    const manualData = useAppSelector(getManualData);
    const externalData = useAppSelector(getExternalData);
    const attributionsToHashes = useAppSelector(
      getExternalAttributionsToHashes,
    );

    const selectedResourceId = useAppSelector(getSelectedResourceId);
    const resolvedExternalAttributions: Set<string> = useAppSelector(
      getResolvedExternalAttributions,
    );

    const containedExternalPackagesWorkerArgs = useMemo(
      () => ({
        selectedResourceId,
        resolvedExternalAttributions,
        panelTitle: PackagePanelTitle.ContainedExternalPackages,
      }),
      [selectedResourceId, resolvedExternalAttributions],
    );
    const containedExternalPackagesSyncFallbackArgs = useMemo(
      () => ({
        selectedResourceId,
        externalData,
        resolvedExternalAttributions,
        attributionsToHashes,
        panelTitle: PackagePanelTitle.ContainedExternalPackages,
      }),
      [
        selectedResourceId,
        externalData,
        resolvedExternalAttributions,
        attributionsToHashes,
      ],
    );

    const containedManualPackagesWorkerArgs = useMemo(
      () => ({
        selectedResourceId,
        panelTitle: PackagePanelTitle.ContainedManualPackages,
      }),

      //  manualData is excluded from dependencies on purpose to avoid recalculation
      //  when it changes. Usually this is not an issue as the displayed data
      //  remains correct. Therefore, the panelData is eventually consistent.
      //  We still need manualData.resourcesToAttributions in the dependencies to
      //  update panelData, when replaceAttributionPopup was called. This is
      //  relevant for manual attributions in the attributions in folder content panel.

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectedResourceId, manualData.resourcesToAttributions],
    );

    const manualPanelData: PanelAttributionData = {
      attributions: manualData.attributions,
      resourcesToAttributions: manualData.resourcesToAttributions,
      resourcesWithAttributedChildren:
        manualData.resourcesWithAttributedChildren,
    };
    const containedManualPackagesSyncFallbackArgs = useMemo(
      () => ({
        selectedResourceId,
        manualData: manualPanelData,
        panelTitle: PackagePanelTitle.ContainedManualPackages,
      }),

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectedResourceId, manualData],
    );

    return (
      <>
        <SyncAccordionPanel
          title={PackagePanelTitle.ExternalPackages}
          getAttributionIdsWithCount={(): Array<AttributionIdWithCount> =>
            getExternalAttributionIdsWithCount(
              externalData.resourcesToAttributions[selectedResourceId] || [],
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
              getDisplayPackageInfosWithCount={
                getContainedExternalDisplayPackageInfosWithCount
              }
              isAddToPackageEnabled={props.isAddToPackageEnabled}
            />
            <WorkerAccordionPanel
              title={PackagePanelTitle.ContainedManualPackages}
              workerArgs={containedManualPackagesWorkerArgs}
              syncFallbackArgs={containedManualPackagesSyncFallbackArgs}
              getDisplayPackageInfosWithCount={
                getContainedManualDisplayPackageInfosWithCount
              }
              isAddToPackageEnabled={props.isAddToPackageEnabled}
            />
          </>
        ) : null}
      </>
    );
  },
);
