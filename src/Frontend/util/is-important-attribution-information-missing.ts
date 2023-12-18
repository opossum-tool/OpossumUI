// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../shared/shared-types';
import { packageInfoKeys } from './get-stripped-package-info';

const TYPES_REQUIRING_NAMESPACE = [
  'bitbucket',
  'composer',
  'deb',
  'github',
  'gitlab',
  'maven',
];

export function isPackageInfoIncomplete(packageInfo: PackageInfo): boolean {
  return packageInfoKeys.some((attributionProperty) =>
    isImportantAttributionInformationMissing(attributionProperty, packageInfo),
  );
}

export function isImportantAttributionInformationMissing(
  attributionProperty: string,
  packageInfo: PackageInfo,
): boolean {
  if (packageInfo.excludeFromNotice || packageInfo.firstParty) {
    return false;
  }
  switch (attributionProperty) {
    case 'copyright':
    case 'licenseName':
    case 'packageName':
    case 'packageType':
    case 'packageVersion':
    case 'url':
      return !packageInfo[attributionProperty];
    case 'packageNamespace':
      const packageType = packageInfo['packageType'];
      return (
        !!packageType &&
        TYPES_REQUIRING_NAMESPACE.includes(packageType) &&
        !packageInfo[attributionProperty]
      );
    default:
      return false;
  }
}
