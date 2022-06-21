// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import React, { ReactElement } from 'react';
import { styled } from '@mui/material/styles';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
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
import { getProjectExternalData } from '../../state/selectors/all-views-resource-selectors';
import { AttributionData } from '../../../shared/shared-types';
import { ButtonText } from '../../enums/enums';

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 16,
  },
}));

interface sourcesTableDataInterface {
  source: string;
  numberOfEntries: number;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T): number {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof number | string>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === 'desc'
    ? (a, b): number => descendingComparator(a, b, orderBy)
    : (a, b): number => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  id: keyof sourcesTableDataInterface;
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
    property: keyof sourcesTableDataInterface
  ) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps): ReactElement {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: keyof sourcesTableDataInterface) =>
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

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const ExternalData: AttributionData = useAppSelector(getProjectExternalData);

  const signals = Object.values(ExternalData.attributions);
  const sources: { [key: string]: number } = {};
  signals.forEach((signal) => {
    sources[signal.source?.name ?? ''] =
      (sources[signal.source?.name ?? ''] || 0) + 1;
  });

  const sourcesTableEntries = [];

  for (const key in sources) {
    sourcesTableEntries.push({ source: key, numberOfEntries: sources[key] });
  }

  function close(): void {
    dispatch(closePopup());
  }
  const [order, setOrder] = React.useState<Order>('desc');
  const [orderBy, setOrderBy] =
    React.useState<keyof sourcesTableDataInterface>('numberOfEntries');

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof sourcesTableDataInterface
  ): void => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const content = (
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

  return (
    <NotificationPopup
      content={content}
      header={'Project Statistics'}
      isOpen={true}
      fullWidth={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
