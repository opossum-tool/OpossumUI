// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionInfo, PackageInfo } from '../../shared/shared-types';
import { getPackageInfoKeys } from '../../shared/shared-util';

const TYPES_REQUIRING_NAMESPACE = [
  'bitbucket',
  'composer',
  'deb',
  'golang',
  'github',
  'maven',
];
interface ExtendedAttributionInfo extends AttributionInfo {
  icons: unknown;
}

export function isPackageInfoIncomplete(packageInfo: PackageInfo): boolean {
  if (!packageInfo) {
    return false;
  }
  return getPackageInfoKeys().some((attributionProperty) =>
    isImportantAttributionInformationMissing(attributionProperty, packageInfo),
  );
}

export function isImportantAttributionInformationMissing(
  attributionProperty: keyof AttributionInfo | 'icons',
  extendedAttributionInfo: Partial<ExtendedAttributionInfo>,
): boolean {
  if (
    extendedAttributionInfo.excludeFromNotice ||
    extendedAttributionInfo.firstParty
  ) {
    return false;
  }
  switch (attributionProperty) {
    case 'copyright':
    case 'licenseName':
    case 'packageName':
    case 'packageType':
    case 'packageVersion':
    case 'url':
      return !extendedAttributionInfo[attributionProperty];
    case 'packageNamespace':
      return isNamespaceRequiredButMissing(
        extendedAttributionInfo['packageType'],
        extendedAttributionInfo[attributionProperty],
      );
    default:
      return false;
  }
}

export function isNamespaceRequiredButMissing(
  packageType?: string,
  packageNamespace?: string,
): boolean {
  if (
    packageType &&
    TYPES_REQUIRING_NAMESPACE.includes(packageType) &&
    !packageNamespace
  ) {
    return true;
  }
  return false;
}
