// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pickBy } from 'lodash';

import {
  DisplayPackageInfo,
  PackageInfo,
  PackageInfoCore,
} from '../../shared/shared-types';

export function getStrippedPackageInfo(packageInfo: PackageInfo): PackageInfo {
  return pickBy(
    packageInfo,
    (value, key) =>
      key in strippedPackageInfoTemplate &&
      (packageInfo.firstParty
        ? !thirdPartyKeys.includes(key as keyof PackageInfo)
        : true) &&
      strippedPackageInfoTemplate[key as keyof PackageInfo] &&
      !!value,
  );
}

export function getStrippedDisplayPackageInfo(packageInfo: DisplayPackageInfo) {
  return pickBy(
    packageInfo,
    (value, key) =>
      key in strippedDisplayPackageInfoTemplate &&
      (packageInfo.firstParty
        ? !thirdPartyKeys.includes(key as keyof PackageInfo)
        : true) &&
      strippedDisplayPackageInfoTemplate[key as keyof DisplayPackageInfo] &&
      !!value,
  );
}

const thirdPartyKeys: Array<keyof PackageInfo> = [
  'copyright',
  'licenseName',
  'licenseText',
];

const strippedPackageInfoCoreTemplate: {
  [P in keyof Required<PackageInfoCore>]: boolean;
} = {
  attributionConfidence: true,
  copyright: true,
  criticality: false,
  excludeFromNotice: true,
  firstParty: true,
  followUp: true,
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
  preferredOverOriginIds: true,
  source: false,
  url: true,
  wasPreferred: true,
};

const strippedPackageInfoTemplate: {
  [P in keyof Required<PackageInfo>]: boolean;
} = {
  ...strippedPackageInfoCoreTemplate,
  comment: true,
};

const strippedDisplayPackageInfoTemplate: {
  [P in keyof Required<DisplayPackageInfo>]: boolean;
} = {
  ...strippedPackageInfoCoreTemplate,
  attributionIds: true,
  comments: true,
};

export const packageInfoKeys = Object.keys(
  strippedPackageInfoTemplate,
) as Array<keyof PackageInfo>;
