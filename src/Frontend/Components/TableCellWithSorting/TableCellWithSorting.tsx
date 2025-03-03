// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { TableCellProps, TableSortLabel } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTableCell from '@mui/material/TableCell';
import { visuallyHidden } from '@mui/utils';

export type Order = 'asc' | 'desc';

interface TableCellWithSortingProps extends TableCellProps {
  order: Order;
  isSortedColumn: boolean;
  onRequestSort: () => void;
}

export const TableCellWithSorting: React.FC<TableCellWithSortingProps> = (
  props,
) => {
  return (
    <MuiTableCell
      {...props}
      sx={{
        '.Mui-active': { color: 'white !important' },
        '& :hover': { color: 'white !important' },
        ...props.sx,
      }}
      sortDirection={props.isSortedColumn ? props.order : false}
    >
      <TableSortLabel
        sx={{
          '& .MuiTableSortLabel-icon': { color: 'white !important' },
        }}
        active={props.isSortedColumn}
        direction={props.isSortedColumn ? props.order : 'asc'}
        onClick={props.onRequestSort}
      >
        {props.children}
        {props.isSortedColumn ? (
          <MuiBox component="span" sx={visuallyHidden}>
            {`sorted ${props.order}ending`}
          </MuiBox>
        ) : null}
      </TableSortLabel>
    </MuiTableCell>
  );
};
