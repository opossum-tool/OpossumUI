// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableRow from '@mui/material/TableRow';
import { getAttributionPropertyDisplayNameFromId } from './project-statistics-popup-helpers';
import { projectStatisticsPopupClasses } from './shared-project-statistics-popup-styles';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableFooter from '@mui/material/TableFooter';

interface AttributionPropertyCountTableProps {
  attributionPropertyCountsEntries: Array<Array<string | number>>;
  title: string;
}

export function AttributionPropertyCountTable(
  props: AttributionPropertyCountTableProps
): ReactElement {
  const attributionPropertyDisplayNames =
    props.attributionPropertyCountsEntries.map((entry) =>
      getAttributionPropertyDisplayNameFromId(entry[0].toString())
    );
  const attributionPropertyCounts = props.attributionPropertyCountsEntries.map(
    (entry) => entry[1].toString()
  );

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer
        sx={projectStatisticsPopupClasses.attributionPropertyCountTable}
      >
        <MuiTable size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {attributionPropertyDisplayNames.map(
                (attributionPropertyDisplayName, index) => (
                  <MuiTableCell
                    sx={projectStatisticsPopupClasses.head}
                    key={index}
                    align="center"
                  >
                    {attributionPropertyDisplayName}
                  </MuiTableCell>
                )
              )}
            </MuiTableRow>
          </MuiTableHead>
          <MuiTableFooter>
            <MuiTableRow>
              {attributionPropertyCounts.map(
                (attributionPropertyCount, index) => (
                  <MuiTableCell
                    sx={projectStatisticsPopupClasses.body}
                    key={index}
                    align="center"
                  >
                    {attributionPropertyCount}
                  </MuiTableCell>
                )
              )}
            </MuiTableRow>
          </MuiTableFooter>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
}
