// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pick, pickBy } from 'lodash';

import { DisplayPackageInfo, PackageInfo } from '../../shared/shared-types';
import { getPackageInfoKeys } from '../../shared/shared-util';
import { getDisplayPackageInfoKeys } from './get-display-package-info-keys';

export function getStrippedPackageInfo(
  rawPackageInfo: PackageInfo,
): PackageInfo {
  const strippedPackageInfo = pickBy(rawPackageInfo, (value) => Boolean(value));
  delete strippedPackageInfo.preSelected;
  delete strippedPackageInfo.criticality;

  return removeExcessProperties(strippedPackageInfo);
}

function removeExcessProperties(rawPackageInfo: PackageInfo): PackageInfo {
  const packageInfoKeys = getPackageInfoKeys();
  return pick(rawPackageInfo, packageInfoKeys);
}

export function getStrippedDisplayPackageInfo(
  rawDisplayPackageInfo: DisplayPackageInfo,
): DisplayPackageInfo {
  const strippedDisplayPackageInfo = pickBy(rawDisplayPackageInfo, (value) =>
    Boolean(value),
  );
  delete strippedDisplayPackageInfo.preSelected;
  delete strippedDisplayPackageInfo.criticality;

  return removeExcessPropertiesOfDisplayPackageInfo(
    strippedDisplayPackageInfo as DisplayPackageInfo,
  );
}

function removeExcessPropertiesOfDisplayPackageInfo(
  rawDisplayPackageInfo: DisplayPackageInfo,
): DisplayPackageInfo {
  const displayPackageInfoKeys = getDisplayPackageInfoKeys();
  return pick(rawDisplayPackageInfo, displayPackageInfoKeys);
}
