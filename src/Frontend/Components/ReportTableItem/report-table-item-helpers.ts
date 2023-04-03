// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionInfo } from '../../../shared/shared-types';
import { TableConfig } from '../Table/Table';
import { PathPredicate } from '../../types/types';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';

export function getFormattedCellData(
  config: TableConfig,
  attributionInfo: AttributionInfo,
  isFileWithChildren: PathPredicate
): string | number {
  let cellData: string | number;
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
    case 'source':
      cellData = attributionInfo[config.attributionProperty]?.name.trim() || '';
      break;
    case 'originIds':
      cellData = '';
      break;
    default:
      cellData = attributionInfo[config.attributionProperty] || '';
      cellData = typeof cellData == 'string' ? cellData.trim() : cellData;
  }

  return cellData;
}
