// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../shared/shared-types';
import { TableConfig } from '../Table/TableConfig';

export function getFormattedCellData(
  config: TableConfig,
  packageInfo: PackageInfo,
): string | number {
  let cellData: string | number;
  switch (config.attributionProperty) {
    case 'firstParty':
    case 'followUp':
    case 'preSelected':
    case 'needsReview':
    case 'excludeFromNotice':
    case 'preferred':
    case 'wasPreferred':
      cellData = packageInfo[config.attributionProperty] ? 'Yes' : 'No';
      break;
    case 'source':
      cellData = packageInfo[config.attributionProperty]?.name.trim() || '';
      break;
    case 'originIds':
    case 'preferredOverOriginIds':
    case 'synthetic':
    case 'icons':
    case 'resources':
      cellData = '';
      break;
    default:
      cellData = packageInfo[config.attributionProperty] || '';
      cellData = typeof cellData === 'string' ? cellData.trim() : cellData;
  }

  return cellData;
}
