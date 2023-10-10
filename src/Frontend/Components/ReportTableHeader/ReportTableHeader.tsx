// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import { tableConfigs } from '../Table/Table';
import { OpossumColors } from '../../shared-styles';
import MuiBox from '@mui/material/Box';

export const reportTableClasses = {
  tableHeader: {
    backgroundColor: OpossumColors.darkBlue,
    position: 'sticky',
    top: '10px',
    textAlign: 'left',
  },
  topHeader: {
    height: '10px',
    backgroundColor: OpossumColors.lightestBlue,
    position: 'sticky',
    top: '0px',
  },
  headerData: {
    fontWeight: 'bold',
    color: OpossumColors.white,
  },
  tableCell: {
    padding: '10px',
    flex: '1 1 auto',
  },
  emptyTableCellNoFlexGrow: {
    flex: '0 1 auto',
  },
  wideTableCell: {
    width: '380px',
  },
  mediumTableCell: {
    width: '250px',
  },
  smallTableCell: {
    width: '120px',
  },
  verySmallTableCell: {
    width: '30px',
    maxWidth: '40px',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'stretch',
  },
  tableWidth: {
    minWidth: '2500px',
  },
};

export function ReportTableHeader(): ReactElement {
  function getTableHeader(): ReactElement {
    return (
      <div>
        <div>
          {
            // this elements implements the top padding
          }
          <MuiBox
            sx={{
              ...reportTableClasses.topHeader,
              ...reportTableClasses.tableHeader,
            }}
          >
            {''}
          </MuiBox>
        </div>
        <MuiBox
          sx={{
            ...reportTableClasses.tableRow,
            ...reportTableClasses.tableWidth,
          }}
        >
          {tableConfigs.map((config) => (
            <MuiBox
              sx={{
                ...reportTableClasses.tableCell,
                ...(config.width === 'small'
                  ? reportTableClasses.smallTableCell
                  : config.width === 'wide'
                  ? reportTableClasses.wideTableCell
                  : config.width === 'medium'
                  ? reportTableClasses.mediumTableCell
                  : config.width === 'verySmall'
                  ? reportTableClasses.verySmallTableCell
                  : {}),
                ...reportTableClasses.tableHeader,
              }}
              key={`table-header-${config.attributionProperty}-${config.displayName}`}
            >
              <MuiTypography sx={reportTableClasses.headerData}>
                {config.displayName}
              </MuiTypography>
            </MuiBox>
          ))}
          <MuiBox
            sx={{
              ...reportTableClasses.tableHeader,
              ...reportTableClasses.emptyTableCellNoFlexGrow,
            }}
          >
            {
              // This element offsets the additional spacing by the virtualized list
            }
          </MuiBox>
        </MuiBox>
      </div>
    );
  }

  return getTableHeader();
}
