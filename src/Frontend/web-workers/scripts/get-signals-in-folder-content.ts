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
import { getContainedExternalPackages } from '../../util/get-contained-packages';
import { sortAttributions } from '../../util/sort-attributions';

interface Props {
  externalData: AttributionData;
  resolvedExternalAttributions: Set<string>;
  resourceId: string;
  sorting: Sorting;
}

export function getSignalsInFolderContent({
  externalData,
  resolvedExternalAttributions,
  resourceId,
  sorting,
}: Props): Attributions {
  const attributionIdsWithCount = getContainedExternalPackages(
    resourceId,
    externalData.resourcesWithAttributedChildren,
    externalData.resourcesToAttributions,
    resolvedExternalAttributions,
  );

  return sortAttributions({
    sorting,
    attributions: attributionIdsWithCount.map<PackageInfo>(
      ({ attributionId, count }) => ({
        ...externalData.attributions[attributionId],
        count,
      }),
    ),
  });
}
