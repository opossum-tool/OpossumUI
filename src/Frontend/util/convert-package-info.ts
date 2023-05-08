// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo, DisplayPackageInfo } from '../../shared/shared-types';
import { getPackageInfoKeys } from '../../shared/shared-util';
import { getDisplayPackageInfoKeys } from './get-display-package-info-keys';
import { shouldNotBeCalled } from './should-not-be-called';

export function convertPackageInfoToDisplayPackageInfo(
  packageInfo: PackageInfo,
  attributionIds: Array<string>
): DisplayPackageInfo {
  const displayPackageInfo: DisplayPackageInfo = {
    attributionIds,
  };
  getDisplayPackageInfoKeys().forEach((displayPackageInfoKey) => {
    switch (displayPackageInfoKey) {
      case 'packageName':
      case 'packageVersion':
      case 'packageNamespace':
      case 'packageType':
      case 'packagePURLAppendix':
      case 'url':
      case 'copyright':
      case 'licenseName':
      case 'licenseText':
        displayPackageInfo[displayPackageInfoKey] =
          packageInfo[displayPackageInfoKey];
        break;
      case 'firstParty':
      case 'preSelected':
      case 'needsReview':
      case 'excludeFromNotice':
        displayPackageInfo[displayPackageInfoKey] =
          packageInfo[displayPackageInfoKey];
        break;
      case 'attributionConfidence':
        displayPackageInfo[displayPackageInfoKey] =
          packageInfo[displayPackageInfoKey];
        break;
      case 'followUp':
        displayPackageInfo[displayPackageInfoKey] =
          packageInfo[displayPackageInfoKey];
        break;
      case 'source':
        displayPackageInfo[displayPackageInfoKey] =
          packageInfo[displayPackageInfoKey];
        break;
      case 'originIds':
        displayPackageInfo[displayPackageInfoKey] =
          packageInfo[displayPackageInfoKey];
        break;
      case 'criticality':
        displayPackageInfo[displayPackageInfoKey] =
          packageInfo[displayPackageInfoKey];
        break;
      case 'comments':
        if (packageInfo.comment) {
          displayPackageInfo.comments = [packageInfo.comment];
        }
        break;
      case 'attributionIds':
        break;
      default:
        shouldNotBeCalled(displayPackageInfoKey);
    }
  });
  return displayPackageInfo;
}

export function convertDisplayPackageInfoToPackageInfo(
  displayPackageInfo: DisplayPackageInfo
): PackageInfo {
  const packageInfo: PackageInfo = {};

  getPackageInfoKeys().forEach((packageInfoKey) => {
    if (packageInfoKey in displayPackageInfo) {
      switch (packageInfoKey) {
        case 'packageName':
        case 'packageVersion':
        case 'packageNamespace':
        case 'packageType':
        case 'packagePURLAppendix':
        case 'url':
        case 'copyright':
        case 'licenseName':
        case 'licenseText':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'comment':
          break;
        case 'firstParty':
        case 'preSelected':
        case 'needsReview':
        case 'excludeFromNotice':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'attributionConfidence':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'followUp':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'source':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'originIds':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'criticality':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        default:
          shouldNotBeCalled(packageInfoKey);
      }
    }
    if (
      displayPackageInfo.attributionIds.length <= 1 &&
      displayPackageInfo.comments
    ) {
      packageInfo.comment = displayPackageInfo.comments[0];
    }
  });

  return packageInfo;
}
