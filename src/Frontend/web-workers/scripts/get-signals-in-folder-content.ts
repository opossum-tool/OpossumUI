// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  AttributionsToHashes,
} from '../../../shared/shared-types';
import { getContainedExternalDisplayPackageInfosWithCount } from '../../Components/AggregatedAttributionsPanel/accordion-panel-helpers';
import { PackagePanelTitle } from '../../enums/enums';
import { PanelData } from '../../types/types';

interface Props {
  externalData: AttributionData;
  attributionsToHashes: AttributionsToHashes;
  resolvedExternalAttributions: Set<string>;
  resourceId: string;
}

export function getSignalsInFolderContent({
  externalData,
  attributionsToHashes,
  resolvedExternalAttributions,
  resourceId,
}: Props): PanelData {
  const [sortedPackageCardIds, displayAttributionIdsWithCount] =
    getContainedExternalDisplayPackageInfosWithCount({
      selectedResourceId: resourceId,
      externalData,
      resolvedExternalAttributions,
      attributionsToHashes,
      panelTitle: PackagePanelTitle.ContainedExternalPackages,
    });

  return {
    sortedPackageCardIds,
    displayPackageInfosWithCount: displayAttributionIdsWithCount,
  };
}
