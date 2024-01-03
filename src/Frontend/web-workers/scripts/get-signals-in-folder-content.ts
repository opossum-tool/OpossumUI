// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionsToHashes } from '../../../shared/shared-types';
import { getContainedExternalDisplayPackageInfosWithCount } from '../../Components/AggregatedAttributionsPanel/AccordionPanel.util';
import { PackagePanelTitle } from '../../enums/enums';
import { PanelData } from '../../types/types';
import { PanelAttributionData } from '../../util/get-contained-packages';

interface Props {
  externalData: PanelAttributionData;
  attributionsToHashes: AttributionsToHashes;
  resolvedExternalAttributions: Set<string>;
  resourceId: string;
  sortByCriticality: boolean;
}

export function getSignalsInFolderContent({
  externalData,
  attributionsToHashes,
  resolvedExternalAttributions,
  resourceId,
  sortByCriticality,
}: Props): PanelData {
  const [sortedPackageCardIds, displayAttributionIdsWithCount] =
    getContainedExternalDisplayPackageInfosWithCount({
      selectedResourceId: resourceId,
      externalData,
      resolvedExternalAttributions,
      attributionsToHashes,
      panelTitle: PackagePanelTitle.ContainedExternalPackages,
      sortByCriticality,
    });

  return {
    sortedPackageCardIds,
    displayPackageInfosWithCount: displayAttributionIdsWithCount,
  };
}
