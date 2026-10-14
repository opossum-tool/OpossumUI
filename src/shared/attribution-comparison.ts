// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual, pickBy } from 'lodash-es';

import type { PackageInfo } from './shared-types';

export const THIRD_PARTY_KEYS: Array<keyof PackageInfo> = [
  'copyright',
  'licenseName',
  'licenseText',
];

export const ATTRIBUTION_CONTENT_ATTRIBUTES = [
  'packageName',
  'packageVersion',
  'packageNamespace',
  'packageType',
  'packagePURLAppendix',
  'url',
  'copyright',
  'licenseName',
  'licenseText',
  'firstParty',
  'comment',
] satisfies Array<keyof PackageInfo>;

export type AttributionContent = Pick<
  PackageInfo,
  (typeof ATTRIBUTION_CONTENT_ATTRIBUTES)[number]
>;

export const COMPARE_TO_MANUAL_ATTRIBUTION_ATTRIBUTES = [
  ...ATTRIBUTION_CONTENT_ATTRIBUTES,
  'attributionConfidence',
  'excludeFromNotice',
  'followUp',
  'needsReview',
  'originIds',
  'preferred',
  'originalAttributionId',
  'originalAttributionSource',
  'originalAttributionWasPreferred',
  'preferredOverOriginIds',
  'wasPreferred',
] satisfies Array<keyof PackageInfo>;

function filterComparableAttributes(
  packageInfo: Partial<PackageInfo>,
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

function filterAttributionContent(packageInfo: AttributionContent) {
  return filterComparableAttributes(
    packageInfo,
    ATTRIBUTION_CONTENT_ATTRIBUTES,
  );
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

export function hasSameAttributionContent(
  a: AttributionContent,
  b: AttributionContent,
): boolean {
  return isEqual(filterAttributionContent(a), filterAttributionContent(b));
}

export function getEffectiveHumanModified(
  previous: AttributionContent,
  proposed: AttributionContent,
  humanModified: boolean | undefined,
): boolean | undefined {
  return hasSameAttributionContent(previous, proposed) ? humanModified : true;
}

export function mergeHumanModified(
  a: boolean | undefined,
  b: boolean | undefined,
): boolean | undefined {
  if (a === undefined || b === undefined) {
    return undefined;
  }
  return a && b;
}
