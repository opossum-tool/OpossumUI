// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTableCell from '@mui/material/TableCell';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';
import { SxProps } from '@mui/system';

import { tableClasses } from '../../../shared-styles';
import {
  Order,
  TableCellWithSorting,
} from '../../TableCellWithSorting/TableCellWithSorting';
import {
  ColumnConfig,
  TableOrdering,
} from '../AttributionCountPerSourcePerLicenseTable.util';

const classes = {
  headerCellWithVerticalSeparator: {
    borderRight: '2px solid lightgray',
  },
  headerCellWithHorizontalSeparator: {
    borderBottom: '1.5px solid lightgray',
  },
} satisfies SxProps;

interface AttributionCountPerSourcePerLicenseTableHeadProps {
  columnConfig: ColumnConfig;
  tableOrdering: TableOrdering;
  onRequestSort: (columnId: string, defaultOrder: Order) => void;
}

export const AttributionCountPerSourcePerLicenseTableHead: React.FC<
  AttributionCountPerSourcePerLicenseTableHeadProps
> = (props) => {
  return (
    <MuiTableHead sx={{ position: 'sticky', top: 0 }}>
      <MuiTableRow>
        {props.columnConfig.groups.map((columnGroup, idx) => {
          return (
            <MuiTableCell
              sx={{
                ...tableClasses.head,
                ...(idx !== props.columnConfig.groups.length - 1
                  ? classes.headerCellWithVerticalSeparator
                  : {}),
                ...classes.headerCellWithHorizontalSeparator,
              }}
              align={'center'}
              colSpan={columnGroup.columns.length}
              key={idx}
            >
              {columnGroup.groupName}
            </MuiTableCell>
          );
        })}
      </MuiTableRow>
      <MuiTableRow>
        {props.columnConfig.groups.flatMap((columnGroup, groupIdx) =>
          columnGroup.columns.map((column, columnIdx) => {
            return (
              <TableCellWithSorting
                sx={{
                  ...tableClasses.head,
                  ...(columnIdx === columnGroup.columns.length - 1 &&
                  groupIdx !== props.columnConfig.groups.length - 1
                    ? classes.headerCellWithVerticalSeparator
                    : {}),
                }}
                key={column.columnName}
                tableCellProps={{
                  align: column.align,
                }}
                order={props.tableOrdering.orderDirection}
                isSortedColumn={
                  props.tableOrdering.orderedColumn === column.columnId
                }
                onRequestSort={() =>
                  props.onRequestSort(column.columnId, column.defaultOrder)
                }
                defaultOrder={column.defaultOrder}
              >
                {column.columnName}
              </TableCellWithSorting>
            );
          }),
        )}
      </MuiTableRow>
    </MuiTableHead>
  );
};
