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

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors, tableClasses } from '../../shared-styles';
import { LicenseCounts, LicenseNamesWithCriticality } from '../../types/types';

const classes = {
  container: {
    maxHeight: '400px',
    marginBottom: '3px',
  },
};

const TOTAL_SOURCE_NAME = 'Total';

interface AttributionCountPerSourcePerLicenseTableProps {
  licenseCounts: LicenseCounts;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  title: string;
}

export const AttributionCountPerSourcePerLicenseTable: React.FC<
  AttributionCountPerSourcePerLicenseTableProps
> = (props) => {
  const sourceNames = Object.keys(
    props.licenseCounts.totalAttributionsPerSource,
  );

  const totalNumberOfAttributionsPerSource = sourceNames.map((sourceName) =>
    props.licenseCounts.totalAttributionsPerSource[sourceName].toString(),
  );
  const totalNumberOfAttributions = Object.values(
    props.licenseCounts.totalAttributionsPerSource,
  )
    .reduce((partialSum, num) => partialSum + num, 0)
    .toString();

  const footerRow = [
    text.attributionCountPerSourcePerLicenseTable.footerTitle,
    '',
    ...totalNumberOfAttributionsPerSource,
    totalNumberOfAttributions,
  ];

  const headerRow = [
    text.attributionCountPerSourcePerLicenseTable.columnNames.licenseName,
    text.attributionCountPerSourcePerLicenseTable.columnNames.criticality,
    ...sourceNames,
    text.attributionCountPerSourcePerLicenseTable.columnNames.totalSources,
  ].map(
    (sourceName) => sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
  );

  Object.entries(
    props.licenseCounts.attributionCountPerSourcePerLicense,
  ).forEach(
    ([licenseName, value]) =>
      (value[TOTAL_SOURCE_NAME] =
        props.licenseCounts.totalAttributionsPerLicense[licenseName]),
  );

  const tableHead = (
    <MuiTableHead>
      <MuiTableRow>
        {headerRow.map((columnHeader, columnIndex) => (
          <MuiTableCell
            sx={tableClasses.head}
            key={columnIndex}
            align={columnIndex === 0 ? 'left' : 'center'}
          >
            {columnHeader}
          </MuiTableCell>
        ))}
      </MuiTableRow>
    </MuiTableHead>
  );

  const buildTableRow = (licenseName: string, rowIndex: number) => {
    const licenseNameCell = (
      <MuiTableCell
        sx={{
          ...tableClasses.body,
        }}
        key={0}
        align={'left'}
      >
        <span>{licenseName}</span>
      </MuiTableCell>
    );

    const licenseCriticality = props.licenseNamesWithCriticality[licenseName];
    const criticalityColor =
      licenseCriticality === Criticality.High
        ? OpossumColors.orange
        : licenseCriticality === Criticality.Medium
          ? OpossumColors.mediumOrange
          : undefined;

    const criticalityCell = (
      <MuiTableCell
        sx={{
          ...tableClasses.body,
          color: criticalityColor,
        }}
        key={1}
        align={'center'}
      >
        <span>{licenseCriticality ?? '-'}</span>
      </MuiTableCell>
    );

    const buildCountBySourceCell =
      (columnOffset: number) => (sourceName: string, sourceIdx: number) => {
        const columnIndex = columnOffset + sourceIdx;

        return (
          <MuiTableCell
            sx={{
              ...tableClasses.body,
            }}
            key={columnIndex}
            align={'center'}
          >
            {props.licenseCounts.attributionCountPerSourcePerLicense[
              licenseName
            ][sourceName] || '-'}
          </MuiTableCell>
        );
      };

    const singleCells = [licenseNameCell, criticalityCell];

    return (
      <MuiTableRow key={rowIndex}>
        {singleCells.concat(
          sourceNames
            .concat(TOTAL_SOURCE_NAME)
            .map(buildCountBySourceCell(singleCells.length)),
        )}
      </MuiTableRow>
    );
  };

  const tableFooter = (
    <MuiTableFooter>
      <MuiTableRow>
        {footerRow.map((total, columnIndex) => (
          <MuiTableCell
            sx={tableClasses.footer}
            key={columnIndex}
            align={columnIndex === 0 ? 'left' : 'center'}
          >
            {total}
          </MuiTableCell>
        ))}
      </MuiTableRow>
    </MuiTableFooter>
  );

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer sx={classes.container}>
        <MuiTable size="small" stickyHeader>
          {tableHead}
          <MuiTableBody>
            {Object.keys(props.licenseNamesWithCriticality)
              .toSorted()
              .map(buildTableRow)}
          </MuiTableBody>
          {tableFooter}
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
};
