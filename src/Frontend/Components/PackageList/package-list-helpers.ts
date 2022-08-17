// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';

function attributionContainsSearchTerm(
  attribution: PackageInfo,
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

export function getSortedFilteredPackageIds(
  attributions: Attributions,
  attributionIds: Array<string>,
  searchTerm: string
): Array<string> {
  return attributionIds
    .filter((id) => attributionContainsSearchTerm(attributions[id], searchTerm))
    .sort(getAlphabeticalComparer(attributions));
}
