// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers -- theme spacing value 0.25 (1px border) */
import { TableCell, TableRow } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import MuiTypography from '@mui/material/Typography';
import type { SxProps } from '@mui/system';

import { OpossumColors } from '../../shared-styles';
import { tableConfigs } from '../ReportView/TableConfig';
import { TableFilterButton } from '../ReportView/TableFilterButton';

const classes = {
  headerRow: {
    backgroundColor: OpossumColors.lightBlue,
    boxShadow: (theme: Theme) => theme.shadows[1],
  },
  headerCell: {
    borderRight: ({ spacing }: Theme) =>
      `${spacing(0.25)} solid ${OpossumColors.mediumGrey}`,
    borderBottom: 'none',
  },
  headerText: {
    p: 2.5,
    fontWeight: 'bold',
  },
  iconsCell: {
    position: 'sticky',
    left: 0,
    background: OpossumColors.lightBlue,
    textAlign: 'center',
  },
} satisfies SxProps<Theme>;

export function ReportTableHeader({ empty = false }: { empty?: boolean }) {
  return (
    <TableRow sx={classes.headerRow}>
      {tableConfigs.map((config) => (
        <TableCell
          variant={'head'}
          component={'th'}
          scope={'col'}
          sx={{
            minWidth: ({ spacing }) => spacing(config.width),
            maxWidth: ({ spacing }) => spacing(config.width),
            ...(config.attributionProperty === 'id' && classes.iconsCell),
            ...classes.headerCell,
          }}
          key={`table-header-${config.attributionProperty}`}
        >
          {config.attributionProperty === 'id' ? (
            <TableFilterButton empty={empty} />
          ) : typeof config.displayName === 'string' ? (
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
