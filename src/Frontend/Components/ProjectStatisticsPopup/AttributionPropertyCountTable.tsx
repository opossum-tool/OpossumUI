// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableRow from '@mui/material/TableRow';
import { getAttributionPropertyDisplayNameFromId } from './project-statistics-popup-helpers';
import { projectStatisticsPopupClasses } from './shared-project-statistics-popup-styles';

interface AttributionPropertyCountTableProps {
  attributionPropertyCountsEntries: Array<Array<string | number>>;
  title: string;
}

export function AttributionPropertyCountTable(
  props: AttributionPropertyCountTableProps
): ReactElement {
  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer
        style={{
          width: '40vw',
        }}
      >
        <MuiTable size="small">
          <MuiTableBody>
            {props.attributionPropertyCountsEntries.map(
              ([attributionProperty, count], index) => (
                <MuiTableRow key={index}>
                  <MuiTableCell
                    sx={projectStatisticsPopupClasses.body}
                    align="center"
                  >
                    {getAttributionPropertyDisplayNameFromId(
                      attributionProperty.toString()
                    )}
                  </MuiTableCell>
                  <MuiTableCell
                    sx={projectStatisticsPopupClasses.body}
                    align="center"
                  >
                    {count}
                  </MuiTableCell>
                </MuiTableRow>
              )
            )}
          </MuiTableBody>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
}
