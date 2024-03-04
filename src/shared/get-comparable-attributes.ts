// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pickBy } from 'lodash';

import { PackageInfo, RawPackageInfo, thirdPartyKeys } from './shared-types';

export const COMPARABLE_ATTRIBUTES = [
  'packageName',
  'packageVersion',
  'packageNamespace',
  'packageType',
  'url',
  'copyright',
  'licenseName',
  'licenseText',
  'firstParty',
  'comment',
] satisfies Array<keyof PackageInfo>;

export type ComparableAttribute = (typeof COMPARABLE_ATTRIBUTES)[number];

export function getComparableAttributes(
  packageInfo: PackageInfo | RawPackageInfo,
) {
  return pickBy(
    packageInfo,
    (value, key) =>
      COMPARABLE_ATTRIBUTES.some((attribute) => attribute === key) &&
      (packageInfo.firstParty
        ? !thirdPartyKeys.includes(key as keyof PackageInfo)
        : true) &&
      !!value,
  );
}
