// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';

import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableRow from '@mui/material/TableRow';
import MuiPaper from '@mui/material/Paper';
import makeStyles from '@mui/styles/makeStyles';
import { getProjectMetadata } from '../../state/selectors/all-views-resource-selectors';
import { ProjectMetadata } from '../../../shared/shared-types';
import { ButtonText } from '../../enums/enums';

const useStyles = makeStyles({
  table: {
    minWidth: 350,
  },
});

export function ProjectMetadataPopup(): ReactElement {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const metadata: ProjectMetadata = useAppSelector(getProjectMetadata);

  function close(): void {
    dispatch(closePopup());
  }

  function mapKeyToString(key: string): string {
    const keyToDisplayName: { [key: string]: string } = {
      projectTitle: 'Project Title',
      projectId: 'Project ID',
      fileCreationDate: 'File Creation Date',
    };

    if (key in keyToDisplayName) {
      return keyToDisplayName[key];
    } else {
      return key;
    }
  }

  function getMuiTableRow(key: string): ReactElement {
    return (
      <MuiTableRow key={key}>
        <MuiTableCell component="th" scope="row">
          {mapKeyToString(key)}
        </MuiTableCell>
        <MuiTableCell>
          <pre>
            {typeof metadata[key] === 'string'
              ? (metadata[key] as string)
              : JSON.stringify(metadata[key], null, 2)}
          </pre>
        </MuiTableCell>
      </MuiTableRow>
    );
  }

  const content = (
    <MuiTableContainer component={MuiPaper}>
      <MuiTable className={classes.table} aria-label="project metadata table">
        <MuiTableBody>
          {Object.keys(metadata).map((key) => getMuiTableRow(key))}
        </MuiTableBody>
      </MuiTable>
    </MuiTableContainer>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Project Metadata'}
      isOpen={true}
      fullWidth={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
