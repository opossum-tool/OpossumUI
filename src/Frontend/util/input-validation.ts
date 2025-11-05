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

const purlTypeRegex = /^[a-z0-9]+$/;

export function isPackageIncomplete(packageInfo: PackageInfo): boolean {
  return packageInfoKeys.some((attribute) =>
    isPackageAttributeIncomplete(attribute, packageInfo),
  );
}

export function isPackageAttributeIncomplete(
  attribute: keyof PackageInfo,
  packageInfo: PackageInfo,
): boolean {
  if (packageInfo.excludeFromNotice || packageInfo.firstParty) {
    return false;
  }
  switch (attribute) {
    case 'copyright':
    case 'licenseName':
    case 'packageName':
    case 'packageType':
    case 'url':
      return !packageInfo[attribute];
    case 'packageNamespace':
      return (
        !!packageInfo.packageType &&
        TYPES_REQUIRING_NAMESPACE.includes(packageInfo.packageType) &&
        !packageInfo[attribute]
      );
    default:
      return false;
  }
}

export function isLegalInformationIncomplete(
  packageInfo: PackageInfo,
): boolean {
  const keys = ['copyright', 'licenseName'] satisfies Array<keyof PackageInfo>;
  return keys.some((attribute) =>
    isPackageAttributeIncomplete(attribute, packageInfo),
  );
}

export function arePackageCoordinatesIncomplete(
  packageInfo: PackageInfo,
): boolean {
  const keys = [
    'url',
    'packageName',
    'packageNamespace',
    'packageType',
  ] satisfies Array<keyof PackageInfo>;
  return keys.some((attribute) =>
    isPackageAttributeIncomplete(attribute, packageInfo),
  );
}

export function isPackageInvalid(packageInfo: PackageInfo): boolean {
  return packageInfoKeys.some((attribute) =>
    isPackageAttributeInvalid(attribute, packageInfo),
  );
}

export function isPackageAttributeInvalid(
  attribute: keyof PackageInfo,
  packageInfo: PackageInfo,
): boolean {
  switch (attribute) {
    case 'packageType': {
      const type = packageInfo[attribute];
      return !!type && !purlTypeRegex.test(type);
    }
    case 'url': {
      const url = packageInfo[attribute];
      if (!url) {
        return false;
      }
      return !isValidUrl(url);
    }
    default:
      return false;
  }
}

function isValidUrl(urlString: string): boolean {
  const trimmed = urlString.trim();

  if (!trimmed || /[\s<>"]/.test(trimmed)) {
    return false;
  }

  try {
    const url = new URL(
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`,
    );

    if (!url.hostname || url.hostname.length === 0) {
      return false;
    }

    if (!url.hostname.includes('.')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
