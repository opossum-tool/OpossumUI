// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionData } from '../../../shared/shared-types';
import { getContainedManualDisplayPackageInfosWithCount } from '../../Components/AggregatedAttributionsPanel/AccordionPanel.util';
import { PackagePanelTitle } from '../../enums/enums';
import { Sorting } from '../../shared-constants';
import { PanelData } from '../../types/types';

interface Props {
  manualData: AttributionData;
  resourceId: string;
  sorting: Sorting;
}

export function getAttributionsInFolderContent({
  manualData,
  resourceId,
  sorting,
}: Props): PanelData {
  const [sortedPackageCardIds, displayPackageInfos] =
    getContainedManualDisplayPackageInfosWithCount({
      selectedResourceId: resourceId,
      manualData,
      panelTitle: PackagePanelTitle.ContainedManualPackages,
      sorting,
    });

  return {
    sortedPackageCardIds,
    displayPackageInfos,
  };
}
