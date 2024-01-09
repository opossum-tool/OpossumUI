// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getContainedManualDisplayPackageInfosWithCount } from '../../Components/AggregatedAttributionsPanel/AccordionPanel.util';
import { PackagePanelTitle } from '../../enums/enums';
import { PanelData } from '../../types/types';
import { PanelAttributionData } from '../../util/get-contained-packages';

interface Props {
  manualData: PanelAttributionData;
  resourceId: string;
  sortByCriticality: boolean;
}

export function getAttributionsInFolderContent({
  manualData,
  resourceId,
  sortByCriticality,
}: Props): PanelData {
  const [sortedPackageCardIds, displayPackageInfosWithCount] =
    getContainedManualDisplayPackageInfosWithCount({
      selectedResourceId: resourceId,
      manualData,
      panelTitle: PackagePanelTitle.ContainedManualPackages,
      sortByCriticality,
    });

  return {
    sortedPackageCardIds,
    displayPackageInfosWithCount,
  };
}
