// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { TableCell, TableRow } from '@mui/material';
import MuiTypography from '@mui/material/Typography';
import { SxProps } from '@mui/system';

import { OpossumColors } from '../../shared-styles';
import { tableConfigs } from '../ReportView/TableConfig';

const classes = {
  headerRow: {
    backgroundColor: OpossumColors.lightBlue,
    boxShadow:
      '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
  },
  headerCell: {
    borderRight: `1px solid ${OpossumColors.mediumGrey}`,
    borderBottom: 'none',
  },
  headerText: {
    padding: '10px',
    fontWeight: 'bold',
  },
  iconsCell: {
    position: 'sticky',
    left: 0,
    background: OpossumColors.lightBlue,
    textAlign: 'center',
  },
} satisfies SxProps;

export function ReportTableHeader() {
  return (
    <TableRow sx={classes.headerRow}>
      {tableConfigs.map((config) => (
        <TableCell
          variant={'head'}
          component={'th'}
          scope={'col'}
          sx={{
            minWidth: config.width,
            maxWidth: config.width,
            ...(config.attributionProperty === 'id' && classes.iconsCell),
            ...classes.headerCell,
          }}
          key={`table-header-${config.attributionProperty}`}
        >
          {typeof config.displayName === 'string' ? (
            <MuiTypography sx={classes.headerText}>
              {config.displayName}
            </MuiTypography>
          ) : (
            config.displayName
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}
