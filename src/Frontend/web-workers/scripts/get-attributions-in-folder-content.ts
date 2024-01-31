// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  PackageInfo,
} from '../../../shared/shared-types';
import { Sorting } from '../../shared-constants';
import { getContainedManualPackages } from '../../util/get-contained-packages';
import { sortAttributions } from '../../util/sort-attributions';

interface Props {
  manualData: AttributionData;
  resourceId: string;
  sorting: Sorting;
}

export function getAttributionsInFolderContent({
  manualData,
  resourceId,
  sorting,
}: Props): Attributions {
  const manualAttributionIdsWithCount = getContainedManualPackages(
    resourceId,
    manualData,
  );

  return sortAttributions({
    sorting,
    attributions: manualAttributionIdsWithCount.map<PackageInfo>(
      ({ attributionId, count }) => ({
        ...manualData.attributions[attributionId],
        count,
      }),
    ),
  });
}
