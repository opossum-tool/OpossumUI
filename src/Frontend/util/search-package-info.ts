// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../shared/shared-types';

export function packageInfoContainsSearchTerm(
  {
    copyright,
    comment,
    packageName,
    packageNamespace,
    packageVersion,
  }: PackageInfo,
  search: string,
): boolean {
  return (
    search === '' ||
    [copyright, comment, packageName, packageNamespace, packageVersion]
      .map((value) => value?.toLowerCase())
      .some((value) => value?.includes(search.toLowerCase()))
  );
}
