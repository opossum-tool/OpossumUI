// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import { DisplayAttributionWithCount } from '../../types/types';

export function getFilteredPackageIdsFromAttributions(
  attributions: Attributions,
  attributionIds: Array<string>,
  searchTerm: string
): Array<string> {
  return attributionIds.filter((id) =>
    attributionContainsSearchTerm(attributions[id], searchTerm)
  );
}

export function getFilteredPackageIdsFromDisplayAttributions(
  displayAttributionsWithCount: Array<DisplayAttributionWithCount>,
  searchTerm: string
): Array<string> {
  return displayAttributionsWithCount
    .filter(({ attribution }) =>
      attributionContainsSearchTerm(attribution, searchTerm)
    )
    .map(({ attributionId }) => attributionId);
}

function attributionContainsSearchTerm(
  attribution: PackageInfo | DisplayPackageInfo,
  searchTerm: string
): boolean {
  return Boolean(
    attribution &&
      (searchTerm === '' ||
        (attribution.packageName &&
          attribution.packageName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (attribution.licenseName &&
          attribution.licenseName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (attribution.copyright &&
          attribution.copyright
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (attribution.packageVersion &&
          attribution.packageVersion
            .toLowerCase()
            .includes(searchTerm.toLowerCase())))
  );
}
