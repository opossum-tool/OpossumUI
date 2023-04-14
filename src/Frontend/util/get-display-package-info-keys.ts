// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfo } from '../../shared/shared-types';
import { KeysOfDisplayPackageInfo } from '../types/types';

export function getDisplayPackageInfoKeys(): Array<KeysOfDisplayPackageInfo> {
  type KeysEnum<T> = { [P in keyof Required<T>]: true };
  const displayPackageInfoKeysObject: KeysEnum<DisplayPackageInfo> = {
    attributionConfidence: true,
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
    originIds: true,
    preSelected: true,
    excludeFromNotice: true,
    criticality: true,
    comments: true,
    attributionIds: true,
  };
  return Object.keys(
    displayPackageInfoKeysObject
  ) as Array<KeysOfDisplayPackageInfo>;
}
