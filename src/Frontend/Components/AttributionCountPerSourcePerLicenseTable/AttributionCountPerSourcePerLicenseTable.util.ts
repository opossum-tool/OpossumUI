// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { TableCellProps } from '@mui/material';
import { orderBy } from 'lodash';

import { LicenseTableRow } from '../../../ElectronBackend/api/statistics';
import { Order } from '../../../shared/shared-types';

export enum SingleColumn {
  NAME = 'NAME',
  CRITICALITY = 'CRITICALITY',
  CLASSIFICATION = 'CLASSIFICATION',
  TOTAL = 'TOTAL',
}

type CountPerSourceColumn = {
  sourceName: string;
};

type ColumnType = SingleColumn | CountPerSourceColumn;

export type Column = {
  columnName: string;
  columnType: ColumnType;
  columnId: string;
  align: TableCellProps['align'];
  defaultOrder: Order;
};

type ColumnGroup = {
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

export function orderLicenseTableRows(
  rows: Array<LicenseTableRow>,
  orderDirection: Order,
  orderedColumnType: ColumnType | undefined,
): Array<LicenseTableRow> {
  return orderBy(
    rows,
    [
      (row) => {
        if (
          orderedColumnType === undefined ||
          orderedColumnType === SingleColumn.NAME
        ) {
          return row.licenseName?.toLowerCase();
        } else if (orderedColumnType === SingleColumn.CRITICALITY) {
          return row.criticality;
        } else if (orderedColumnType === SingleColumn.CLASSIFICATION) {
          return row.classification;
        } else if (orderedColumnType === SingleColumn.TOTAL) {
          return row.total;
        }

        return row.perSource[orderedColumnType.sourceName] ?? 0;
      },
      (row) => row.licenseName?.toLowerCase(),
    ],
    [orderDirection, 'asc'],
  );
}
