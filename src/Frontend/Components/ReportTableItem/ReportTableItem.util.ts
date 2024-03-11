// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact } from 'lodash';

import { PackageInfo } from '../../../shared/shared-types';
import { TableConfig } from '../ReportView/TableConfig';

export function getFormattedCellData(
  config: TableConfig,
  packageInfo: PackageInfo,
): string | number {
  let cellData: string | number;
  switch (config.attributionProperty) {
    case 'excludeFromNotice':
    case 'firstParty':
    case 'followUp':
    case 'needsReview':
    case 'preSelected':
    case 'preferred':
    case 'wasPreferred':
      cellData = packageInfo[config.attributionProperty] ? 'Yes' : 'No';
      break;
    case 'source':
      cellData = packageInfo[config.attributionProperty]?.name.trim() || '';
      break;
    case 'id':
    case 'originIds':
    case 'originalAttributionId':
    case 'originalAttributionSource':
    case 'originalAttributionWasPreferred':
    case 'preferredOverOriginIds':
    case 'resources':
    case 'synthetic':
      cellData = '';
      break;
    case 'packageName':
      cellData = compact([
        packageInfo.packageName,
        packageInfo.packageNamespace,
      ]).join(':');
      break;
    default:
      cellData = packageInfo[config.attributionProperty] || '';
      cellData = typeof cellData === 'string' ? cellData.trim() : cellData;
  }

  return cellData;
}
