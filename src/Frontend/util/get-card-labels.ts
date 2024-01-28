// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { first } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';

const PRIORITIZED_DISPLAY_PACKAGE_INFO_ATTRIBUTES = [
  'packageName',
  'licenseName',
  'copyright',
  'licenseText',
  'comments',
  'url',
] satisfies Array<keyof PackageInfo>;

type Attribute = (typeof PRIORITIZED_DISPLAY_PACKAGE_INFO_ATTRIBUTES)[number];

const FIRST_PARTY_TEXT = 'First party';

export function getCardLabels(packageInfo: PackageInfo): Array<string> {
  const packageLabels: Array<string> = [];

  for (const attribute of PRIORITIZED_DISPLAY_PACKAGE_INFO_ATTRIBUTES) {
    addPackageLabelsFromAttribute(packageInfo, attribute, packageLabels);
    if (packageLabels.length > 1) {
      break;
    }
  }

  addFirstPartyTextIfNoOtherTextPresent(packageLabels, packageInfo);
  return packageLabels;
}

function addPackageLabelsFromAttribute(
  packageInfo: PackageInfo,
  attribute: Attribute,
  packageLabels: Array<string>,
): void {
  if (packageInfo[attribute]) {
    if (packageLabels.length === 0) {
      addFirstLineOfPackageLabelFromAttribute(
        attribute,
        packageInfo,
        packageLabels,
      );
    } else {
      addSecondLineOfPackageLabelFromAttribute(
        attribute,
        packageInfo,
        packageLabels,
      );
    }
  } else if (
    attribute === 'packageName' &&
    !packageInfo['packageName'] &&
    packageInfo['url']
  ) {
    addFirstLineOfPackageLabelFromAttribute('url', packageInfo, packageLabels);
  }
}

export function addFirstLineOfPackageLabelFromAttribute(
  attribute: Attribute,
  packageInfo: PackageInfo,
  packageLabels: Array<string>,
): void {
  let firstLinePackageLabel: string;
  if (attribute === 'packageName') {
    firstLinePackageLabel = packageInfo.packageVersion
      ? `${packageInfo.packageName}, ${packageInfo.packageVersion}`
      : `${packageInfo.packageName}`;
  } else if (attribute === 'copyright') {
    firstLinePackageLabel = addPreambleToCopyright(`${packageInfo.copyright}`);
  } else if (attribute === 'comments') {
    firstLinePackageLabel = first(packageInfo.comments) || '';
  } else {
    firstLinePackageLabel = packageInfo[attribute] || '';
  }
  packageLabels.push(firstLinePackageLabel);
}

export function addSecondLineOfPackageLabelFromAttribute(
  attribute: Attribute,
  packageInfo: PackageInfo,
  packageLabels: Array<string>,
): void {
  let secondLinePackageLabel: string;
  if (attribute === 'copyright') {
    secondLinePackageLabel = addPreambleToCopyright(`${packageInfo.copyright}`);
  } else if (attribute === 'comments') {
    secondLinePackageLabel = first(packageInfo.comments) || '';
  } else {
    secondLinePackageLabel = packageInfo[attribute] || '';
  }
  if (!(attribute === 'url' && packageLabels[0] === `${packageInfo['url']}`)) {
    packageLabels.push(secondLinePackageLabel);
  }
}

export function addPreambleToCopyright(originalCopyright: string): string {
  const copyrightPrefixLength = 3;
  const copyrightLength = 9;
  let copyright = originalCopyright;
  if (
    originalCopyright.substring(0, copyrightPrefixLength).toLowerCase() !==
      '(c)' &&
    originalCopyright.substring(0, copyrightLength).toLowerCase() !==
      'copyright'
  ) {
    copyright = `(c) ${originalCopyright}`;
  }
  return copyright;
}

function addFirstPartyTextIfNoOtherTextPresent(
  packageLabels: Array<string>,
  packageInfo: PackageInfo,
): void {
  if (packageLabels.length === 0 && packageInfo.firstParty) {
    packageLabels.push(FIRST_PARTY_TEXT);
  }
}
