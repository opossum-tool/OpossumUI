// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableFooter from '@mui/material/TableFooter';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';
import MuiTypography from '@mui/material/Typography';
import { orderBy } from 'lodash';
import { useMemo, useState } from 'react';

import { Criticality } from '../../../shared/shared-types';
import {
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { Order } from '../TableCellWithSorting/TableCellWithSorting';
import { AttributionCountPerSourcePerLicenseTableFooter } from './AttributionCountPerSourcePerLicenseTableFooter/AttributionCountPerSourcePerLicenseTableFooter';
import { AttributionCountPerSourcePerLicenseTableHead } from './AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead';
import { AttributionCountPerSourcePerLicenseTableRow } from './AttributionCountPerSourcePerLicenseTableRow/AttributionCountPerSourcePerLicenseTableRow';
import { tableClasses } from '../../shared-styles';

const classes = {
  container: {
    maxHeight: '400px',
    marginBottom: '3px',
  },
};

interface AttributionCountPerSourcePerLicenseTableProps {
  licenseCounts: LicenseCounts;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  licenseNamesWithClassification: LicenseNamesWithClassification;
  title: string;
}

export const AttributionCountPerSourcePerLicenseTable: React.FC<
  AttributionCountPerSourcePerLicenseTableProps
> = (props) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderedColumn, setOrderedColumn] = useState(0);

  const handleRequestSort = (columnIndex: number) => {
    setOrder(orderedColumn === columnIndex && order === 'asc' ? 'desc' : 'asc');
    setOrderedColumn(columnIndex);
  };

  const sourceNames = Object.keys(
    props.licenseCounts.totalAttributionsPerSource,
  );

  const sortedLicenseNames = useMemo(
    () =>
      orderBy(
        Object.keys(props.licenseNamesWithCriticality).toSorted(),
        (licenseName) => {
          const numStartingColumns = 3;

          if (orderedColumn === 0) {
            return licenseName.toLowerCase();
          } else if (orderedColumn === 1) {
            switch (props.licenseNamesWithCriticality[licenseName]) {
              case Criticality.High:
                return 2;
              case Criticality.Medium:
                return 1;
              default:
                return 0;
            }
          } else if (orderedColumn === 2) {
            return props.licenseNamesWithClassification[licenseName];
          } else if (orderedColumn < numStartingColumns + sourceNames.length) {
            return (
              props.licenseCounts.attributionCountPerSourcePerLicense[
                licenseName
              ][sourceNames[orderedColumn - numStartingColumns]] ?? 0
            );
          }

          return props.licenseCounts.totalAttributionsPerLicense[licenseName];
        },
        order,
      ),
    [
      props.licenseNamesWithCriticality,
      props.licenseNamesWithClassification,
      props.licenseCounts,
      order,
      orderedColumn,
      sourceNames,
    ],
  );

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer sx={classes.container}>
        <MuiTable size="small" stickyHeader>
          <AttributionCountPerSourcePerLicenseTableHead
            sourceNames={sourceNames}
            order={order}
            orderBy={orderedColumn}
            onRequestSort={handleRequestSort}
          />
          <MuiTableBody>
            {sortedLicenseNames.map((licenseName, rowIndex) => (
              <AttributionCountPerSourcePerLicenseTableRow
                sourceNames={sourceNames}
                signalCountsPerSource={
                  props.licenseCounts.attributionCountPerSourcePerLicense[
                    licenseName
                  ]
                }
                licenseName={licenseName}
                licenseCriticality={
                  props.licenseNamesWithCriticality[licenseName]
                }
                licenseClassification={
                  props.licenseNamesWithClassification[licenseName]
                }
                totalSignalCount={
                  props.licenseCounts.totalAttributionsPerLicense[licenseName]
                }
                key={rowIndex}
                rowIndex={rowIndex}
              />
            ))}
          </MuiTableBody>
          {tableFooter}
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
};
