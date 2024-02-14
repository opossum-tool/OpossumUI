// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableRow from '@mui/material/TableRow';
import MuiTypography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React, { ReactElement } from 'react';

import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getProjectMetadata } from '../../state/selectors/resource-selectors';

export const projectMetadataTableClasses = {
  firstColumn: {
    fontSize: 13,
    background: OpossumColors.darkBlue,
    color: OpossumColors.white,
    width: 'max-content',
  },
  secondColumn: {
    fontSize: 11,
    background: OpossumColors.lightestBlue,
    width: 'max-content',
    overflow: 'auto',
    color: OpossumColors.black,
  },
  container: {
    maxHeight: '500px',
    width: 'max-content',
    marginBottom: 3,
  },
};

const values: { [key: string]: { title: string; date: boolean } } = {
  buildDate: { title: 'Build Date', date: true },
  expectedReleaseDate: { title: 'Expected Release Date', date: true },
  fileCreationDate: { title: 'File Creation Date', date: true },
  projectId: { title: 'Project ID', date: false },
  projectTitle: { title: 'Project Title', date: false },
  projectVersion: { title: 'Project Version', date: false },
};

export function ProjectMetadataTable(): ReactElement {
  const projectMetadata = useAppSelector(getProjectMetadata);

  return (
    <MuiBox>
      <MuiTableContainer sx={projectMetadataTableClasses.container}>
        <MuiTable>
          <MuiTableBody>{renderRows()}</MuiTableBody>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );

  function renderRows(): React.ReactNode {
    return Object.entries(projectMetadata).map(([key, value]) => (
      <MuiTableRow key={key}>
        <MuiTableCell sx={projectMetadataTableClasses.firstColumn}>
          {values[key]?.title ?? key}
        </MuiTableCell>
        <MuiTableCell sx={projectMetadataTableClasses.secondColumn}>
          <pre>
            <MuiTypography fontFamily="default">
              {typeof value === 'string'
                ? values[key]?.date
                  ? dayjs(value).format('lll')
                  : value
                : JSON.stringify(value, null, 2)}
            </MuiTypography>
          </pre>
        </MuiTableCell>
      </MuiTableRow>
    ));
  }
}
