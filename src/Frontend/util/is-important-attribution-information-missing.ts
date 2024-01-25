// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfo, PackageInfo } from '../../shared/shared-types';
import { packageInfoKeys } from './get-stripped-package-info';

const TYPES_REQUIRING_NAMESPACE = [
  'bitbucket',
  'composer',
  'deb',
  'github',
  'gitlab',
  'maven',
];

export function isPackageInfoIncomplete(
  packageInfo: PackageInfo | DisplayPackageInfo,
): boolean {
  return packageInfoKeys.some((attributionProperty) =>
    isImportantAttributionInformationMissing(attributionProperty, packageInfo),
  );
}

export function isImportantAttributionInformationMissing(
  attributionProperty: string,
  packageInfo: PackageInfo | DisplayPackageInfo,
): boolean {
  if (packageInfo.excludeFromNotice || packageInfo.firstParty) {
    return false;
  }
  switch (attributionProperty) {
    case 'copyright':
    case 'licenseName':
    case 'packageName':
    case 'packageType':
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
