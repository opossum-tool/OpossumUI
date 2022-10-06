// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  AttributionCountPerSourcePerLicense,
  LICENSE_COLUMN_NAME_IN_TABLE_Key,
  LICENSE_TOTAL_Key,
  LicenseNamesWithCriticality,
  PLACEHOLDER_ATTRIBUTION_COUNT,
  SOURCE_TOTAL_Key,
} from './project-statistics-popup-helpers';
import MuiTypography from '@mui/material/Typography';
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableFooter from '@mui/material/TableFooter';
import MuiTableRow from '@mui/material/TableRow';
import { projectStatisticsPopupClasses } from './shared-project-statistics-popup-styles';
import { OpossumColors } from '../../shared-styles';
import { Criticality } from '../../../shared/shared-types';

export interface AttributionCountPerSourcePerLicenseTableProps {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  title: string;
}

export function AttributionCountPerSourcePerLicenseTable(
  props: AttributionCountPerSourcePerLicenseTableProps
): ReactElement {
  const sourceNamesOrTotal = Object.keys(
    props.attributionCountPerSourcePerLicense[LICENSE_TOTAL_Key]
  );
  sourceNamesOrTotal.splice(sourceNamesOrTotal.indexOf(SOURCE_TOTAL_Key), 1);
  sourceNamesOrTotal.push(SOURCE_TOTAL_Key);
  const sourceNamesRow = [LICENSE_COLUMN_NAME_IN_TABLE_Key].concat(
    sourceNamesOrTotal
  );

  const valuesSourceTotals: Array<string> = sourceNamesOrTotal.map(
    (sourceName) =>
      props.attributionCountPerSourcePerLicense[LICENSE_TOTAL_Key][
        sourceName
      ].toString()
  );
  const totalsRow: Array<string> = [SOURCE_TOTAL_Key].concat(
    valuesSourceTotals
  );
  const sortedLicenseNames = Object.keys(props.licenseNamesWithCriticality)
    .slice()
    .sort();

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer
        sx={
          projectStatisticsPopupClasses.attributionCountPerSourcePerLicenseTable
        }
      >
        <MuiTable size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {sourceNamesRow.map((sourceName, index) => (
                <MuiTableCell
                  sx={projectStatisticsPopupClasses.head}
                  key={index}
                  align={index === 0 ? 'left' : 'center'}
                >
                  {sourceName}
                </MuiTableCell>
              ))}
            </MuiTableRow>
          </MuiTableHead>

          <MuiTableBody>
            {sortedLicenseNames.map((licenseName, rowIndex) => (
              <MuiTableRow key={rowIndex}>
                {sourceNamesRow.map((sourceName, index) => (
                  <MuiTableCell
                    sx={{
                      ...projectStatisticsPopupClasses.body,
                      ...(index === 0
                        ? props.licenseNamesWithCriticality[licenseName] ===
                          Criticality.High
                          ? { color: OpossumColors.orange }
                          : props.licenseNamesWithCriticality[licenseName] ===
                            Criticality.Medium
                          ? { color: OpossumColors.mediumOrange }
                          : {}
                        : {}),
                    }}
                    key={index}
                    align={index === 0 ? 'left' : 'center'}
                  >
                    {index === 0
                      ? licenseName
                      : props.attributionCountPerSourcePerLicense[licenseName][
                          sourceName
                        ] || PLACEHOLDER_ATTRIBUTION_COUNT}
                  </MuiTableCell>
                ))}
              </MuiTableRow>
            ))}
          </MuiTableBody>

          <MuiTableFooter>
            <MuiTableRow>
              {totalsRow.map((total, index) => (
                <MuiTableCell
                  sx={projectStatisticsPopupClasses.footer}
                  key={index}
                  align={index === 0 ? 'left' : 'center'}
                >
                  {total}
                </MuiTableCell>
              ))}
            </MuiTableRow>
          </MuiTableFooter>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
}
