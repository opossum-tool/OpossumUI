// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual, pickBy } from 'lodash';

import { type PackageInfo } from './shared-types';

export const THIRD_PARTY_KEYS: Array<keyof PackageInfo> = [
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

export const COMPARE_TO_MANUAL_ATTRIBUTION_ATTRIBUTES = [
  ...FORM_ATTRIBUTES,
  'attributionConfidence',
  'excludeFromNotice',
  'followUp',
  'needsReview',
  'originIds',
  'packagePURLAppendix',
  'preferred',
  'originalAttributionId',
  'originalAttributionSource',
  'originalAttributionWasPreferred',
  'preferredOverOriginIds',
  'wasPreferred',
] satisfies Array<keyof PackageInfo>;

export type FormAttribute = (typeof FORM_ATTRIBUTES)[number];

function filterComparableAttributes(
  packageInfo: PackageInfo,
  attributeList: Array<keyof PackageInfo>,
) {
  return pickBy(
    packageInfo,
    (value, key) =>
      attributeList.some((attribute) => attribute === key) &&
      (packageInfo.firstParty
        ? !THIRD_PARTY_KEYS.includes(key as keyof PackageInfo)
        : true) &&
      !!value,
  );
}

function filterManualComparableAttributes(packageInfo: PackageInfo) {
  return filterComparableAttributes(
    packageInfo,
    COMPARE_TO_MANUAL_ATTRIBUTION_ATTRIBUTES,
  );
}

function filterExternalComparableAttributes(packageInfo: PackageInfo) {
  return filterComparableAttributes(packageInfo, FORM_ATTRIBUTES);
}

export function isEqualToManualAttribution(
  a: PackageInfo,
  b: PackageInfo,
): boolean {
  return isEqual(
    filterManualComparableAttributes(a),
    filterManualComparableAttributes(b),
  );
}

export function isEqualToExternalAttribution(
  a: PackageInfo,
  b: PackageInfo,
): boolean {
  return isEqual(
    filterExternalComparableAttributes(a),
    filterExternalComparableAttributes(b),
  );
}
