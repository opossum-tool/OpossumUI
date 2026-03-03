// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { TableCellProps, TableSortLabel } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTableCell from '@mui/material/TableCell';
import { SxProps } from '@mui/system';
import { visuallyHidden } from '@mui/utils';
import { PropsWithChildren } from 'react';

import { Order } from '../../../shared/shared-types';

interface TableCellWithSortingProps extends PropsWithChildren {
  order: Order;
  isSortedColumn: boolean;
  onRequestSort: () => void;
  defaultOrder: Order;
  tableCellProps?: TableCellProps;
  sx?: SxProps;
}

export const TableCellWithSorting: React.FC<TableCellWithSortingProps> = (
  props,
) => {
  return (
    <MuiTableCell
      {...props.tableCellProps}
      sx={{
        '.Mui-active': { color: 'white !important' },
        '& :hover': { color: 'white !important' },
        ...props.sx,
      }}
      sortDirection={props.isSortedColumn ? props.order : false}
      data-testid="table-cell-with-sorting"
    >
      <TableSortLabel
        sx={{
          '& .MuiTableSortLabel-icon': { color: 'white !important' },
        }}
        active={props.isSortedColumn}
        direction={props.isSortedColumn ? props.order : props.defaultOrder}
        onClick={props.onRequestSort}
      >
        {props.children}
        {props.isSortedColumn ? (
          <MuiBox component="span" sx={{ ...visuallyHidden }}>
            {`sorted ${props.order}ending`}
          </MuiBox>
        ) : null}
      </TableSortLabel>
    </MuiTableCell>
  );
};
