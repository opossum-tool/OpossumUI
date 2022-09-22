// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  AttributionCountPerSourcePerLicense,
  LicenseNamesWithCriticality,
  LICENSE_TOTAL_HEADER,
  SOURCE_TOTAL_HEADER,
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

const PLACEHOLDER_ATTRIBUTION_COUNT = '-';

interface AttributionCountPerSourcePerLicenseTableProps {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  title: string;
}

export function AttributionCountPerSourcePerLicenseTable(
  props: AttributionCountPerSourcePerLicenseTableProps
): ReactElement {
  const sourceNamesOrTotal = Object.keys(
    props.attributionCountPerSourcePerLicense[LICENSE_TOTAL_HEADER]
  );
  sourceNamesOrTotal.splice(sourceNamesOrTotal.indexOf(SOURCE_TOTAL_HEADER), 1);
  sourceNamesOrTotal.push(SOURCE_TOTAL_HEADER);
  const sourceNamesRow = ['LICENSE'].concat(sourceNamesOrTotal);

  const valuesSourceTotals: Array<string> = sourceNamesOrTotal.map(
    (sourceName) =>
      props.attributionCountPerSourcePerLicense[LICENSE_TOTAL_HEADER][
        sourceName
      ].toString()
  );
  const totalsRow: Array<string> = [SOURCE_TOTAL_HEADER].concat(
    valuesSourceTotals
  );
  const sortedLicenseNames = Object.keys(props.licenseNamesWithCriticality)
    .slice()
    .sort();

  return (
    <MuiBox sx={projectStatisticsPopupClasses.marginTop}>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer sx={projectStatisticsPopupClasses.bigTable}>
        <MuiTable size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {sourceNamesRow.map((sourceName, index) => (
                <MuiTableCell
                  sx={projectStatisticsPopupClasses.head}
                  key={index}
                  align="center"
                >
                  {sourceName.toUpperCase()}
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
                          'high'
                          ? { color: OpossumColors.orange }
                          : props.licenseNamesWithCriticality[licenseName] ===
                            'medium'
                          ? { color: OpossumColors.mediumOrange }
                          : {}
                        : {}),
                    }}
                    key={index}
                    align="center"
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

          <MuiTableFooter sx={projectStatisticsPopupClasses.footer}>
            <MuiTableRow>
              {totalsRow.map((total, index) => (
                <MuiTableCell
                  sx={projectStatisticsPopupClasses.footer}
                  key={index}
                  align="center"
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
