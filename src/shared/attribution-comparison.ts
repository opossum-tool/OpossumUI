// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual, pickBy } from 'lodash';

import { type PackageInfo } from './shared-types';

export const thirdPartyKeys: Array<keyof PackageInfo> = [
  'copyright',
  'licenseName',
  'licenseText',
];

export const FORM_ATTRIBUTES = [
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

export type FormAttribute = (typeof FORM_ATTRIBUTES)[number];

export function getComparableAttributes(packageInfo: PackageInfo) {
  return pickBy(
    packageInfo,
    (value, key) =>
      FORM_ATTRIBUTES.some((attribute) => attribute === key) &&
      (packageInfo.firstParty
        ? !thirdPartyKeys.includes(key as keyof PackageInfo)
        : true) &&
      !!value,
  );
}

export function areAttributionsEqual(a: PackageInfo, b: PackageInfo): boolean {
  return isEqual(getComparableAttributes(a), getComparableAttributes(b));
}
