// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from './shared-types';
import { KeysOfPackageInfo } from '../Frontend/types/types';

export function getPackageInfoKeys(): Array<KeysOfPackageInfo> {
  type KeysEnum<T> = { [P in keyof Required<T>]: true };
  const packageInfoKeysObject: KeysEnum<PackageInfo> = {
    attributionConfidence: true,
    comment: true,
    packageName: true,
    packageVersion: true,
    packageNamespace: true,
    packageType: true,
    packagePURLAppendix: true,
    url: true,
    copyright: true,
    licenseName: true,
    licenseText: true,
    source: true,
    firstParty: true,
    followUp: true,
    originId: true,
    preSelected: true,
    excludeFromNotice: true,
  };
  return Object.keys(packageInfoKeysObject) as Array<KeysOfPackageInfo>;
}
