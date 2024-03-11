// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual, pickBy } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';
import { thirdPartyKeys } from '../shared-constants';

export function getStrippedPackageInfo(packageInfo: PackageInfo) {
  return pickBy(
    packageInfo,
    (value, key) =>
      key in strippedPackageInfoTemplate &&
      (packageInfo.firstParty
        ? !thirdPartyKeys.includes(key as keyof PackageInfo)
        : true) &&
      strippedPackageInfoTemplate[key as keyof PackageInfo] &&
      !!value &&
      !isEqual(value, []),
  );
}

const strippedPackageInfoTemplate: {
  [P in keyof Required<PackageInfo>]: boolean;
} = {
  attributionConfidence: true,
  comment: true,
  copyright: true,
  count: false,
  criticality: false,
  excludeFromNotice: true,
  firstParty: true,
  followUp: true,
  id: false,
  licenseName: true,
  licenseText: true,
  needsReview: true,
  originIds: true,
  packageName: true,
  packageNamespace: true,
  packagePURLAppendix: true,
  packageType: true,
  packageVersion: true,
  preSelected: false,
  preferred: true,
  originalAttributionId: true,
  originalAttributionSource: true,
  originalAttributionWasPreferred: true,
  preferredOverOriginIds: true,
  relation: false,
  resources: false,
  source: false,
  suffix: false,
  synthetic: false,
  url: true,
  wasPreferred: true,
};

export const packageInfoKeys = Object.keys(
  strippedPackageInfoTemplate,
) as Array<keyof PackageInfo>;
