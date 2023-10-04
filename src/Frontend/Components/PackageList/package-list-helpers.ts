// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfoCore } from '../../../shared/shared-types';
import { DisplayPackageInfos } from '../../types/types';

export function getFilteredPackageCardIdsFromDisplayPackageInfos(
  displayPackageInfos: DisplayPackageInfos,
  sortedPackageCardIds: Array<string>,
  searchTerm: string,
): Array<string> {
  return sortedPackageCardIds.filter((packageCardId) => {
    return displayPackageInfoContainsSearchTerm(
      displayPackageInfos[packageCardId],
      searchTerm,
    );
  });
}

export function displayPackageInfoContainsSearchTerm(
  attribution: PackageInfoCore,
  searchTerm: string,
): boolean {
  console.log(attribution);
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
          .includes(searchTerm.toLowerCase()))),
  );
}
