// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { cloneDeep, isEmpty } from 'lodash';
import { PackageInfo } from '../../shared/shared-types';

export function packageInfoHasNoSignificantFields(
  packageInfo: PackageInfo
): boolean {
  const packageInfoWithSignificantFields = cloneDeep(packageInfo);
  delete packageInfoWithSignificantFields.attributionConfidence;
  delete packageInfoWithSignificantFields.followUp;
  delete packageInfoWithSignificantFields.originId;
  delete packageInfoWithSignificantFields.preSelected;
  delete packageInfoWithSignificantFields.excludeFromNotice;
  return isEmpty(packageInfoWithSignificantFields);
}
