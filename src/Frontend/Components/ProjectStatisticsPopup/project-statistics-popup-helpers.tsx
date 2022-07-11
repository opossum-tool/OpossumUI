// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableFooter from '@mui/material/TableFooter';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/system';
import {
  PackageInfo,
  ExternalAttributionSources,
} from '../../../shared/shared-types';

interface SignalCountPerSourcePerLicense {
  [licenseNameOrTotal: string]: { [sourceNameOrTotal: string]: number };
}

export const SOURCE_TOTAL = 'Total';
export const LICENSE_TOTAL = 'Total';
const PLACEHOLDER = '-';
const VIEWPORT_HEIGHT_MINUS_SHOWN_TABLE_HEIGHT = 210;

const StyledTableCell = styled(TableCell)(() => ({
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

export function getProjectStatisticsTable(
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
    <Box sx={{ width: '100%' }}>
      <TableContainer
        style={{
          height: `calc(100vh - ${VIEWPORT_HEIGHT_MINUS_SHOWN_TABLE_HEIGHT}px)`,
        }}
      >
        <Table sx={{ minWidth: 300 }} size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {sourceNamesRow.map((sourceName, index) => (
                <StyledTableCell key={index} align="center">
                  {sourceName.toUpperCase()}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedLicenseNames.map((licenseName, rowIndex) => (
              <TableRow key={rowIndex}>
                {sourceNamesRow.map((sourceName, index) => (
                  <StyledTableCell key={index} align="center">
                    {index === 0
                      ? licenseName
                      : signalCountPerSourcePerLicense[licenseName][
                          sourceName
                        ] || PLACEHOLDER}
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>

          <TableFooter style={{ position: 'sticky', bottom: 0 }}>
            <TableRow>
              {totalsRow.map((total, index) => (
                <StyledTableCell key={index} align="center">
                  {total}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Box>
  );
}
