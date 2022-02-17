// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { pick, pickBy } from 'lodash';
import { PackageInfo } from '../../shared/shared-types';
import { getPackageInfoKeys } from '../../shared/shared-util';

export function getStrippedPackageInfo(
  rawPackageInfo: PackageInfo
): PackageInfo {
  const strippedTemporaryPackageInfo = pickBy(rawPackageInfo, (value) =>
    Boolean(value)
  );
  delete strippedTemporaryPackageInfo.source;
  delete strippedTemporaryPackageInfo.preSelected;

  return removeExcessProperties(strippedTemporaryPackageInfo);
}

function removeExcessProperties(rawPackageInfo: PackageInfo): PackageInfo {
  const packageInfoKeys = getPackageInfoKeys();
  return pick(rawPackageInfo, packageInfoKeys);
}
