// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell, { tableCellClasses } from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableFooter from '@mui/material/TableFooter';
import MuiTableRow from '@mui/material/TableRow';
import { styled } from '@mui/system';
import {
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';

interface SignalCountPerSourcePerLicense {
  [licenseNameOrTotal: string]: { [sourceNameOrTotal: string]: number };
}

interface SignalCountPerAttributionProperty {
  [attributionPropertyOrTotal: string]: number;
}

const ATTRIBUTION_PROPERTIES_TO_DISPLAY: Array<keyof PackageInfo> = [
  'followUp',
  'firstParty',
];
export const SOURCE_TOTAL = 'Total';
export const LICENSE_TOTAL = 'Total';
export const ATTRIBUTION_TOTAL = 'Total Attributions';
const PLACEHOLDER = '-';
const ATTRIBUTION_PROPERTIES_SHORT_NAME_TO_LONG_NAME: {
  [attributionProperty: string]: string;
} = {
  followUp: 'Follow up',
  firstParty: 'First party',
};

const StyledTableCell = styled(MuiTableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  [`&.${tableCellClasses.footer}`]: {
    fontWeight: 'bold',
    fontSize: 16,
    background: 'white',
    borderBottom: 0,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 16,
  },
}));

export function aggregateLicensesAndSourcesFromSignals(
  signals: Array<PackageInfo>,
  attributionSources: ExternalAttributionSources
): [SignalCountPerSourcePerLicense, Array<string>] {
  const signalCountPerSourcePerLicense: SignalCountPerSourcePerLicense = {};

  for (const signal of signals) {
    const licenseName = signal.licenseName ?? PLACEHOLDER;
    const sourceName = getSourceLongNameFromShortName(
      signal.source?.name ?? PLACEHOLDER,
      attributionSources
    );

    const sourcesCountForLicense =
      signalCountPerSourcePerLicense[licenseName] ?? {};
    sourcesCountForLicense[sourceName] =
      (sourcesCountForLicense[sourceName] || 0) + 1;
    signalCountPerSourcePerLicense[licenseName] = sourcesCountForLicense;
  }

  for (const licenseName of Object.keys(signalCountPerSourcePerLicense)) {
    signalCountPerSourcePerLicense[licenseName][SOURCE_TOTAL] = Object.values(
      signalCountPerSourcePerLicense[licenseName]
    ).reduce((total, value) => {
      return total + value;
    });
  }

  const licenseNames: Array<string> = Object.keys(
    signalCountPerSourcePerLicense
  );

  signalCountPerSourcePerLicense[LICENSE_TOTAL] = {};
  for (const licenseName of Object.keys(signalCountPerSourcePerLicense)) {
    if (licenseName !== LICENSE_TOTAL) {
      for (const sourceName of Object.keys(
        signalCountPerSourcePerLicense[licenseName]
      )) {
        signalCountPerSourcePerLicense[LICENSE_TOTAL][sourceName] =
          (signalCountPerSourcePerLicense[LICENSE_TOTAL][sourceName] || 0) +
          signalCountPerSourcePerLicense[licenseName][sourceName];
      }
    }
  }
  if (licenseNames.length === 0) {
    signalCountPerSourcePerLicense[LICENSE_TOTAL][SOURCE_TOTAL] = 0;
  }

  return [signalCountPerSourcePerLicense, licenseNames];
}

export function aggregateAttributionPropertiesFromSignals(
  signals: Array<PackageInfo>
): SignalCountPerAttributionProperty {
  const attributionPropertyCounts: SignalCountPerAttributionProperty = {};
  for (const attributionProperty of ATTRIBUTION_PROPERTIES_TO_DISPLAY) {
    attributionPropertyCounts[attributionProperty] = 0;
  }

  for (const signal of signals) {
    for (const attributionProperty of ATTRIBUTION_PROPERTIES_TO_DISPLAY) {
      if (signal[attributionProperty]) {
        attributionPropertyCounts[attributionProperty]++;
      }
    }
  }

  attributionPropertyCounts[ATTRIBUTION_TOTAL] = signals.length;

  return attributionPropertyCounts;
}

function getSourceLongNameFromShortName(
  sourceShortName: string,
  externalAttributionSources: ExternalAttributionSources
): string {
  if (
    Object.keys(externalAttributionSources).includes(sourceShortName) &&
    sourceShortName !== PLACEHOLDER
  ) {
    return externalAttributionSources[sourceShortName]['name'];
  }
  return sourceShortName;
}

function getAttributionPropertyLongNameFromShortName(
  attributionProperty: string
): string {
  if (attributionProperty in ATTRIBUTION_PROPERTIES_SHORT_NAME_TO_LONG_NAME) {
    return ATTRIBUTION_PROPERTIES_SHORT_NAME_TO_LONG_NAME[attributionProperty];
  }
  return attributionProperty;
}

function getSignalCountPerSourcePerLicenseTable(
  signalCountPerSourcePerLicense: SignalCountPerSourcePerLicense,
  licenseNames: Array<string>
): ReactElement {
  const sourceNamesOrTotal = Object.keys(
    signalCountPerSourcePerLicense[LICENSE_TOTAL]
  );
  sourceNamesOrTotal.splice(sourceNamesOrTotal.indexOf(SOURCE_TOTAL), 1);
  sourceNamesOrTotal.push(SOURCE_TOTAL);
  const sourceNamesRow = ['LICENSE'].concat(sourceNamesOrTotal);

  const valuesSourceTotals = sourceNamesOrTotal.map((sourceName) =>
    String(signalCountPerSourcePerLicense[LICENSE_TOTAL][sourceName])
  );
  const totalsRow: Array<string> = [SOURCE_TOTAL].concat(valuesSourceTotals);

  const sortedLicenseNames = licenseNames.slice().sort();

  return (
    <MuiBox sx={{ width: '100%' }}>
      <MuiTypography variant="h6">Signals per Sources</MuiTypography>
      <MuiTableContainer
        style={{
          height: 'calc(55vh)',
        }}
      >
        <MuiTable sx={{ minWidth: 300 }} size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {sourceNamesRow.map((sourceName, index) => (
                <StyledTableCell key={index} align="center">
                  {sourceName.toUpperCase()}
                </StyledTableCell>
              ))}
            </MuiTableRow>
          </MuiTableHead>

          <MuiTableBody>
            {sortedLicenseNames.map((licenseName, rowIndex) => (
              <MuiTableRow key={rowIndex}>
                {sourceNamesRow.map((sourceName, index) => (
                  <StyledTableCell key={index} align="center">
                    {index === 0
                      ? licenseName
                      : signalCountPerSourcePerLicense[licenseName][
                          sourceName
                        ] || PLACEHOLDER}
                  </StyledTableCell>
                ))}
              </MuiTableRow>
            ))}
          </MuiTableBody>

          <MuiTableFooter style={{ position: 'sticky', bottom: 0 }}>
            <MuiTableRow>
              {totalsRow.map((total, index) => (
                <StyledTableCell key={index} align="center">
                  {total}
                </StyledTableCell>
              ))}
            </MuiTableRow>
          </MuiTableFooter>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
}

function getAttributionPropertyCountTable(
  attributionPropertyCounts: SignalCountPerAttributionProperty
): ReactElement {
  const attributionPropertiesOrTotalEntries = Object.entries(
    attributionPropertyCounts
  );

  // Move ATTRIBUTION_TOTAL to the end of the list
  /* eslint-disable @typescript-eslint/no-unused-vars */
  attributionPropertiesOrTotalEntries.sort(
    ([property1, _count1], [_property2, _count2]) =>
      property1 == ATTRIBUTION_TOTAL ? 1 : 0
  );
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return (
    <MuiBox sx={{ width: '100%' }}>
      <MuiTypography variant="h6">Attribution types</MuiTypography>
      <MuiTableContainer
        style={{
          width: 'calc(40%)',
        }}
      >
        <MuiTable size="small">
          <MuiTableBody>
            {attributionPropertiesOrTotalEntries.map(
              ([attributionProperty, count], index) => (
                <MuiTableRow key={index}>
                  <StyledTableCell align="center">
                    {getAttributionPropertyLongNameFromShortName(
                      attributionProperty
                    )}
                  </StyledTableCell>
                  <StyledTableCell align="center">{count}</StyledTableCell>
                </MuiTableRow>
              )
            )}
          </MuiTableBody>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
}

export function getProjectStatisticsPopupContent(
  signalCountPerSourcePerLicense: SignalCountPerSourcePerLicense,
  licenseNames: Array<string>,
  attributionPropertyCounts: SignalCountPerAttributionProperty
): ReactElement {
  const signalCountPerSourcePerLicenseTable =
    getSignalCountPerSourcePerLicenseTable(
      signalCountPerSourcePerLicense,
      licenseNames
    );
  const attributionCountTable = getAttributionPropertyCountTable(
    attributionPropertyCounts
  );

  return (
    <>
      {signalCountPerSourcePerLicenseTable}
      {attributionCountTable}
    </>
  );
}
