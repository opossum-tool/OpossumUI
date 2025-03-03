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
import { useMemo, useState } from 'react';

import {
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { orderLicenseNames } from './AttributionCountPerSourcePerLicenseTable.util';
import { AttributionCountPerSourcePerLicenseTableFooter } from './AttributionCountPerSourcePerLicenseTableFooter/AttributionCountPerSourcePerLicenseTableFooter';
import {
  AttributionCountPerSourcePerLicenseTableHead,
  TableOrdering,
} from './AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead';
import { AttributionCountPerSourcePerLicenseTableRow } from './AttributionCountPerSourcePerLicenseTableRow/AttributionCountPerSourcePerLicenseTableRow';
import { tableClasses } from '../../shared-styles';

const classes = {
  container: {
    maxHeight: '400px',
    marginBottom: '3px',
  },
};

const DEFAULT_ORDERING: TableOrdering = {
  orderDirection: 'asc',
  orderedColumn: 0,
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
  const [ordering, setOrdering] = useState(DEFAULT_ORDERING);

  const handleRequestSort = (columnIndex: number) => {
    if (ordering.orderedColumn === columnIndex) {
      setOrdering({
        ...ordering,
        orderDirection: ordering.orderDirection === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setOrdering({
        orderDirection: 'asc',
        orderedColumn: columnIndex,
      });
    }
  };

  const sourceNames = Object.keys(
    props.licenseCounts.totalAttributionsPerSource,
  );

  const orderedLicenseNames = useMemo(
    () =>
      orderLicenseNames(
        props.licenseNamesWithCriticality,
        props.licenseNamesWithClassification,
        props.licenseCounts,
        ordering,
        sourceNames,
      ),
    [
      props.licenseNamesWithCriticality,
      props.licenseNamesWithClassification,
      props.licenseCounts,
      ordering,
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
            tableOrdering={ordering}
            onRequestSort={handleRequestSort}
          />
          <MuiTableBody>
            {orderedLicenseNames.map((licenseName, rowIndex) => (
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
