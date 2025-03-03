// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTableCell from '@mui/material/TableCell';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';
import { SxProps } from '@mui/system';
import { upperFirst } from 'lodash';

import { text } from '../../../../shared/text';
import { tableClasses } from '../../../shared-styles';
import {
  Order,
  TableCellWithSorting,
} from '../../TableCellWithSorting/TableCellWithSorting';

const classes = {
  headerCellWithVerticalSeparator: {
    borderRight: '2px solid lightgray',
  },
  headerCellWithHorizontalSeparator: {
    borderBottom: '1.5px solid lightgray',
  },
} satisfies SxProps;

export type TableOrdering = {
  orderDirection: Order;
  orderedColumn: number;
};

interface AttributionCountPerSourcePerLicenseTableHeadProps {
  sourceNames: Array<string>;
  tableOrdering: TableOrdering;
  onRequestSort: (columnIndex: number) => void;
}

export const AttributionCountPerSourcePerLicenseTableHead: React.FC<
  AttributionCountPerSourcePerLicenseTableHeadProps
> = (props) => {
  const componentText = text.attributionCountPerSourcePerLicenseTable;

  const headerRow = [
    componentText.columns.licenseName,
    componentText.columns.criticality.title,
    componentText.columns.classification,
    ...props.sourceNames.map(upperFirst),
    componentText.columns.totalSources,
  ];

  return (
    <MuiTableHead sx={{ position: 'sticky', top: 0 }}>
      <MuiTableRow>
        <MuiTableCell
          sx={{
            ...tableClasses.head,
            ...classes.headerCellWithVerticalSeparator,
            ...classes.headerCellWithHorizontalSeparator,
          }}
          align={'center'}
          colSpan={3}
        >
          {componentText.columns.licenseInfo}
        </MuiTableCell>
        <MuiTableCell
          sx={{
            ...tableClasses.head,
            ...classes.headerCellWithHorizontalSeparator,
          }}
          align={'center'}
          colSpan={props.sourceNames.length + 1}
        >
          {componentText.columns.signalCountPerSource}
        </MuiTableCell>
      </MuiTableRow>
      <MuiTableRow>
        {headerRow.map((columnHeader, columnIndex) => (
          <TableCellWithSorting
            sx={{
              ...tableClasses.head,
              ...(columnIndex === 2
                ? classes.headerCellWithVerticalSeparator
                : {}),
            }}
            key={columnIndex}
            align={columnIndex === 0 ? 'left' : 'center'}
            order={props.tableOrdering.orderDirection}
            isSortedColumn={props.tableOrdering.orderedColumn === columnIndex}
            onRequestSort={() => props.onRequestSort(columnIndex)}
          >
            {columnHeader}
          </TableCellWithSorting>
        ))}
      </MuiTableRow>
    </MuiTableHead>
  );
};
