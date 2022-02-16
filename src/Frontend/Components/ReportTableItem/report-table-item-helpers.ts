// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Source } from '../../../shared/shared-types';
import { AttributionInfo, TableConfig } from '../Table/Table';
import { PathPredicate } from '../../types/types';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';

export function getFormattedCellData(
  config: TableConfig,
  attributionInfo: AttributionInfo,
  isFileWithChildren: PathPredicate
): string | number | Source {
  let cellData;
  switch (config.attributionProperty) {
    case 'resources':
      cellData = attributionInfo[config.attributionProperty]
        .map((resourcePath) =>
          removeTrailingSlashIfFileWithChildren(
            resourcePath,
            isFileWithChildren
          )
        )
        .join('\n');
      break;
    case 'firstParty':
    case 'followUp':
    case 'preSelected':
    case 'excludeFromNotice':
      cellData = attributionInfo[config.attributionProperty] ? 'Yes' : 'No';
      break;
    case 'icons':
      cellData = '';
      break;
    default:
      cellData = attributionInfo[config.attributionProperty] || '';
      cellData = typeof cellData == 'string' ? cellData.trim() : cellData;
  }

  return cellData;
}

export function isMarkedTableCell(
  config: TableConfig,
  attributionInfo: AttributionInfo
): boolean {
  if (attributionInfo.excludeFromNotice || attributionInfo.firstParty) {
    return false;
  }
  switch (config.attributionProperty) {
    case 'copyright':
    case 'licenseName':
    case 'packageName':
    case 'packageVersion':
    case 'url':
      return !attributionInfo[config.attributionProperty];
    case 'attributionConfidence':
      return (
        !attributionInfo['attributionConfidence'] ||
        attributionInfo['attributionConfidence'] < 50
      );
    default:
      return false;
  }
}
