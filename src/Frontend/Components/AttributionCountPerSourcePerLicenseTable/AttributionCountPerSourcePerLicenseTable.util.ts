// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { TableCellProps } from '@mui/material';
import { orderBy } from 'lodash';

import { Criticality } from '../../../shared/shared-types';
import {
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { Order } from '../TableCellWithSorting/TableCellWithSorting';

export enum SingleColumn {
  NAME = 'NAME',
  CRITICALITY = 'CRITICALITY',
  CLASSIFICATION = 'CLASSIFICATION',
  TOTAL = 'TOTAL',
}

export type CountPerSourceColumn = {
  sourceName: string;
};

export type ColumnType = SingleColumn | CountPerSourceColumn;

export type Column = {
  columnName: string;
  columnType: ColumnType;
  columnId: string;
  align: TableCellProps['align'];
  defaultOrder: Order;
};

export type ColumnGroup = {
  groupName: string;
  columns: Array<Column>;
};

export class ColumnConfig {
  readonly groups: Array<ColumnGroup>;

  constructor(groups: Array<ColumnGroup>) {
    this.groups = groups;
  }

  getColumns(): Array<Column> {
    return this.groups.flatMap((columnGroup) => columnGroup.columns);
  }

  getColumnById(id: string): Column | undefined {
    return this.getColumns().find((column) => column.columnId === id);
  }
}

export type TableOrdering = {
  orderDirection: Order;
  orderedColumn: string;
};

export function orderLicenseNames(
  licenseNamesWithCriticality: LicenseNamesWithCriticality,
  licenseNamesWithClassification: LicenseNamesWithClassification,
  licenseCounts: LicenseCounts,
  orderDirection: Order,
  orderedColumnType: ColumnType,
): Array<string> {
  return orderBy(
    Object.keys(licenseNamesWithCriticality),
    [
      (licenseName) => {
        if (orderedColumnType === SingleColumn.NAME) {
          return licenseName.toLowerCase();
        } else if (orderedColumnType === SingleColumn.CRITICALITY) {
          switch (licenseNamesWithCriticality[licenseName]) {
            case Criticality.High:
              return 2;
            case Criticality.Medium:
              return 1;
            default:
              return 0;
          }
        } else if (orderedColumnType === SingleColumn.CLASSIFICATION) {
          return licenseNamesWithClassification[licenseName];
        } else if (orderedColumnType === SingleColumn.TOTAL) {
          return licenseCounts.totalAttributionsPerLicense[licenseName];
        }

        return (
          licenseCounts.attributionCountPerSourcePerLicense[licenseName][
            orderedColumnType.sourceName
          ] ?? 0
        );
      },
      (licenseName) => licenseName.toLowerCase(),
    ],
    [orderDirection, 'asc'],
  );
}
