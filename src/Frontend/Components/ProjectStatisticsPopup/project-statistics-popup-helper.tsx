// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import React, { ReactElement } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { SortingOrder, SignalsPerSource } from '../../types/types';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T): number {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof number | string>(
  order: SortingOrder,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === 'desc'
    ? (a, b): number => descendingComparator(a, b, orderBy)
    : (a, b): number => -descendingComparator(a, b, orderBy);
}

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 16,
  },
}));

interface HeadCell {
  id: keyof SignalsPerSource;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'source',
    numeric: false,
    label: 'Sources',
  },
  {
    id: 'numberOfEntries',
    numeric: true,
    label: 'Signals',
  },
];

interface EnhancedTableProps {
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof SignalsPerSource
  ) => void;
  order: SortingOrder;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps): ReactElement {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: keyof SignalsPerSource) =>
    (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <StyledTableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </StyledTableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export function getProjectStatisticsTableContent(
  order: SortingOrder,
  orderBy: string,
  handleRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof SignalsPerSource
  ) => void,
  sourcesTableEntries: SignalsPerSource[]
): ReactElement {
  return (
    <Box sx={{ width: '30%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer style={{ maxHeight: 300 }}>
          <Table
            sx={{ minWidth: 300 }}
            aria-labelledby="tableTitle"
            size="small"
            stickyHeader
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={sourcesTableEntries.length}
            />
            <TableBody>
              {sourcesTableEntries
                .sort(getComparator(order, orderBy))
                .map((row, index) => {
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow hover tabIndex={-1} key={row.source}>
                      <TableCell component="th" id={labelId} scope="row">
                        {row.source}
                      </TableCell>
                      <TableCell align="right">{row.numberOfEntries}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
