// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  AttributionCountPerSourcePerLicense,
  LICENSE_COLUMN_NAME_IN_TABLE_Key,
  LicenseNamesWithCriticality,
  PLACEHOLDER_ATTRIBUTION_COUNT,
  SOURCE_TOTAL_Key,
  TOTAL_COLUMN_NAME_IN_TABLE_Key,
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

function getLicenseNamesByCriticality(
  allLicensesWithCriticality: Array<{
    licenseName: string;
    criticality: Criticality | undefined;
  }>,
  criticality: Criticality
): Array<string> {
  return allLicensesWithCriticality
    .map((licenseNameAndCriticality) =>
      licenseNameAndCriticality.criticality === criticality
        ? licenseNameAndCriticality.licenseName
        : ''
    )
    .filter((licenseName) => licenseName !== '');
}

function getCriticalLicenseNamesWithTheirTotalAttributions(
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense,
  criticalLicenseNames: Array<string>
): Array<{ licenseName: string; totalNumberOfAttributions: number }> {
  const licenseNamesAndTheirTotalAttributions = criticalLicenseNames.map(
    (criticalLicenseName) => {
      return {
        licenseName: criticalLicenseName,
        totalNumberOfAttributions:
          attributionCountPerSourcePerLicense[criticalLicenseName][
            SOURCE_TOTAL_Key
          ],
      };
    }
  );
  return licenseNamesAndTheirTotalAttributions.sort();
}

function getTotalNumberOfAttributions(
  licenseNamesAndTheirTotalAttributions: Array<{
    licenseName: string;
    totalNumberOfAttributions: number;
  }>
): number {
  return licenseNamesAndTheirTotalAttributions
    .map(
      (licenseNameAndTotalAttributions) =>
        licenseNameAndTotalAttributions.totalNumberOfAttributions
    )
    .reduce((total, value) => total + value, 0);
}

interface CriticalLicensesTableProps {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  title: string;
}

export function CriticalLicensesTable(
  props: CriticalLicensesTableProps
): ReactElement {
  const allLicensesWithCriticality = Object.entries(
    props.licenseNamesWithCriticality
  ).map((licenseNameAndCriticality) => {
    return {
      licenseName: licenseNameAndCriticality[0],
      criticality: licenseNameAndCriticality[1],
    };
  });
  const highCriticalityLicenseNames = getLicenseNamesByCriticality(
    allLicensesWithCriticality,
    Criticality.High
  );
  const mediumCriticalityLicenseNames = getLicenseNamesByCriticality(
    allLicensesWithCriticality,
    Criticality.Medium
  );
  const highCriticalityLicensesTotalAttributions =
    getCriticalLicenseNamesWithTheirTotalAttributions(
      props.attributionCountPerSourcePerLicense,
      highCriticalityLicenseNames
    );
  const mediumCriticalityLicensesTotalAttributions =
    getCriticalLicenseNamesWithTheirTotalAttributions(
      props.attributionCountPerSourcePerLicense,
      mediumCriticalityLicenseNames
    );
  const criticalLicensesTotalAttributions =
    highCriticalityLicensesTotalAttributions.concat(
      mediumCriticalityLicensesTotalAttributions
    );
  const tableColumnNames = [
    LICENSE_COLUMN_NAME_IN_TABLE_Key,
    TOTAL_COLUMN_NAME_IN_TABLE_Key,
  ];
  const tableFooter = [SOURCE_TOTAL_Key].concat(
    getTotalNumberOfAttributions(criticalLicensesTotalAttributions).toString()
  );

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer
        sx={projectStatisticsPopupClasses.criticalLicensesTable}
      >
        <MuiTable size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {tableColumnNames.map((columnName, index) => (
                <MuiTableCell
                  sx={projectStatisticsPopupClasses.head}
                  key={index}
                  align={index === 0 ? 'left' : 'center'}
                >
                  {columnName.toUpperCase()}
                </MuiTableCell>
              ))}
            </MuiTableRow>
          </MuiTableHead>

          <MuiTableBody>
            {criticalLicensesTotalAttributions.map(
              ({ licenseName, totalNumberOfAttributions }, rowIndex) => (
                <MuiTableRow key={rowIndex}>
                  {tableColumnNames.map((columnName, index) => (
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
                        : totalNumberOfAttributions ||
                          PLACEHOLDER_ATTRIBUTION_COUNT}
                    </MuiTableCell>
                  ))}
                </MuiTableRow>
              )
            )}
          </MuiTableBody>

          <MuiTableFooter>
            <MuiTableRow>
              {tableFooter.map((total, index) => (
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
