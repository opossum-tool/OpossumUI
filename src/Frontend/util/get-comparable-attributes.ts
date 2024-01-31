// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pickBy } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';
import { thirdPartyKeys } from '../shared-constants';

export const FORM_ATTRIBUTES = [
  'packageName',
  'packageVersion',
  'packageNamespace',
  'packageType',
  'url',
  'copyright',
  'licenseName',
  'licenseText',
  'firstParty',
  'comment',
] satisfies Array<keyof PackageInfo>;
export type FormAttribute = (typeof FORM_ATTRIBUTES)[number];

export function getComparableAttributes(packageInfo: PackageInfo) {
  return pickBy(
    packageInfo,
    (value, key) =>
      FORM_ATTRIBUTES.some((attribute) => attribute === key) &&
      (packageInfo.firstParty
        ? !thirdPartyKeys.includes(key as keyof PackageInfo)
        : true) &&
      !!value,
  );
}
