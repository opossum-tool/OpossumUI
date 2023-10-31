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
import { ReactElement } from 'react';

import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getProjectMetadata } from '../../state/selectors/all-views-resource-selectors';

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

const keyToDisplayName: { [key: string]: string } = {
  projectTitle: 'Project Title',
  projectId: 'Project ID',
  fileCreationDate: 'File Creation Date',
};

export function ProjectMetadataTable(): ReactElement {
  const projectMetadata = useAppSelector(getProjectMetadata);

  function mapKeyToDisplayName(key: string): string {
    return key in keyToDisplayName ? keyToDisplayName[key] : key;
  }

  function getTableRow(key: string): ReactElement {
    return (
      <MuiTableRow key={key}>
        <MuiTableCell sx={projectMetadataTableClasses.firstColumn}>
          {mapKeyToDisplayName(key)}
        </MuiTableCell>
        <MuiTableCell sx={projectMetadataTableClasses.secondColumn}>
          <pre>
            <MuiTypography fontFamily="default">
              {typeof projectMetadata[key] === 'string'
                ? (projectMetadata[key] as string)
                : JSON.stringify(projectMetadata[key], null, 2)}
            </MuiTypography>
          </pre>
        </MuiTableCell>
      </MuiTableRow>
    );
  }

  return (
    <MuiBox>
      <MuiTableContainer sx={projectMetadataTableClasses.container}>
        <MuiTable>
          <MuiTableBody>
            {Object.keys(projectMetadata).map((key) => getTableRow(key))}
          </MuiTableBody>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
}
