// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfos } from '../../types/types';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';

export function getFilteredPackageCardIdsFromDisplayPackageInfos(
  displayPackageInfos: DisplayPackageInfos,
  sortedPackageCardIds: Array<string>,
  searchTerm: string,
): Array<string> {
  return sortedPackageCardIds.filter((packageCardId) => {
    return packageInfoContainsSearchTerm(
      displayPackageInfos[packageCardId],
      searchTerm,
    );
  });
}
