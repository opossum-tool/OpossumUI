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
import { ReactElement } from 'react';

import { Criticality } from '../../../shared/shared-types';
import { OpossumColors, tableClasses } from '../../shared-styles';
import { LicenseNamesWithCriticality } from '../../types/types';

const PLACEHOLDER_ATTRIBUTION_COUNT = '-';

interface TableContent {
  [rowName: string]: { [columnName: string]: number };
}

interface ProjectLicensesTableProps {
  title: string;
  containerStyle: { [key: string]: string | number };
  columnHeaders: Array<string>;
  columnNames: Array<string>;
  rowNames: Array<string>;
  tableContent: TableContent;
  tableFooter?: Array<string>;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
}

export function ProjectLicensesTable(
  props: ProjectLicensesTableProps,
): ReactElement {
  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer sx={props.containerStyle}>
        <MuiTable size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {props.columnHeaders.map((columnHeader, columnIndex) => (
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
          <MuiTableBody>
            {props.rowNames.map((rowName, rowIndex) => (
              <MuiTableRow key={rowIndex}>
                {props.columnNames.map((columnName, columnIndex) => (
                  <MuiTableCell
                    sx={{
                      ...tableClasses.body,
                      ...(columnIndex === 0
                        ? props.licenseNamesWithCriticality[rowName] ===
                          Criticality.High
                          ? { color: OpossumColors.orange }
                          : props.licenseNamesWithCriticality[rowName] ===
                              Criticality.Medium
                            ? { color: OpossumColors.mediumOrange }
                            : {}
                        : {}),
                    }}
                    key={columnIndex}
                    align={columnIndex === 0 ? 'left' : 'center'}
                  >
                    {columnIndex === 0 ? (
                      <span>{rowName}</span>
                    ) : (
                      props.tableContent[rowName][columnName] ||
                      PLACEHOLDER_ATTRIBUTION_COUNT
                    )}
                  </MuiTableCell>
                ))}
              </MuiTableRow>
            ))}
          </MuiTableBody>
          {props.tableFooter && (
            <MuiTableFooter>
              <MuiTableRow>
                {props.tableFooter.map((total, columnIndex) => (
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
          )}
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
}
