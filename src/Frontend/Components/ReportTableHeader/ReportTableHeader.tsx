// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import clsx from 'clsx';
import MuiTypography from '@mui/material/Typography';
import { tableConfigs } from '../Table/Table';
import makeStyles from '@mui/styles/makeStyles';
import { OpossumColors } from '../../shared-styles';

export const useStylesReportTableHeader = makeStyles({
  tableHeader: {
    backgroundColor: OpossumColors.darkBlue,
    position: 'sticky',
    top: 10,
    textAlign: 'left',
  },
  topHeader: {
    height: 10,
    backgroundColor: OpossumColors.lightestBlue,
    position: 'sticky',
    top: 0,
    border: `0.5px ${OpossumColors.lightestBlue} solid`,
  },
  headerData: {
    fontWeight: 'bold',
    color: OpossumColors.white,
  },
  tableCell: {
    padding: 10,
    flex: '1 1 auto',
  },
  emptyTableCell: {
    paddingTop: 10,
    flex: '1 1 auto',
  },
  emptyTableCellNoFlexGrow: {
    flex: '0 1 auto',
  },
  wideTableCell: {
    width: 380,
  },
  mediumTableCell: {
    width: 250,
  },
  smallTableCell: {
    width: 120,
  },
  verySmallTableCell: {
    width: 30,
    maxWidth: 40,
  },
  tableRow: {
    display: 'flex',
    alignItems: 'stretch',
  },
  tableWidth: {
    minWidth: 2500,
  },
});

export function ReportTableHeader(): ReactElement {
  const classes = useStylesReportTableHeader();

  function getTableHeader(): ReactElement {
    return (
      <div>
        <div>
          {
            // this elements implements the top padding
          }
          <div className={clsx(classes.topHeader, classes.tableHeader)}>
            {''}
          </div>
        </div>
        <div className={clsx(classes.tableRow, classes.tableWidth)}>
          {tableConfigs.map((config) => (
            <div
              className={clsx(
                config.attributionProperty === 'icons'
                  ? classes.emptyTableCell
                  : classes.tableCell,
                config.width === 'small'
                  ? classes.smallTableCell
                  : config.width === 'wide'
                  ? classes.wideTableCell
                  : config.width === 'medium'
                  ? classes.mediumTableCell
                  : config.width === 'verySmall'
                  ? classes.verySmallTableCell
                  : undefined,
                classes.tableHeader
              )}
              key={`table-header-${config.attributionProperty}-${config.displayName}`}
            >
              <MuiTypography className={classes.headerData}>
                {config.displayName}
              </MuiTypography>
            </div>
          ))}
          <div
            className={clsx(
              classes.tableHeader,
              classes.emptyTableCellNoFlexGrow
            )}
          >
            {
              // This element offsets the additional spacing by the virtualized list
            }
          </div>
        </div>
      </div>
    );
  }

  return getTableHeader();
}
