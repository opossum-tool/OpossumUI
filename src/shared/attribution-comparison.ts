// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual, pickBy } from 'lodash-es';

import type { CommonPackageInfo } from './shared-types';

export const THIRD_PARTY_KEYS: Array<keyof CommonPackageInfo> = [
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
] satisfies Array<keyof CommonPackageInfo>;

export type AttributionContent = Pick<
  CommonPackageInfo,
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
] satisfies Array<keyof CommonPackageInfo>;

function filterComparableAttributes(
  packageInfo: Partial<CommonPackageInfo>,
  attributeList: Array<keyof CommonPackageInfo>,
) {
  return pickBy(
    packageInfo,
    (value, key) =>
      attributeList.some((attribute) => attribute === key) &&
      (packageInfo.firstParty
        ? !THIRD_PARTY_KEYS.includes(key as keyof CommonPackageInfo)
        : true) &&
      !!value,
  );
}

function filterManualComparableAttributes(packageInfo: CommonPackageInfo) {
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
  a: CommonPackageInfo,
  b: CommonPackageInfo,
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
