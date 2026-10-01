// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialogContent from '@mui/material/DialogContent';
import { styled } from '@mui/system';

import { LogDisplay } from '../LogDisplay/LogDisplay';

const GRID_ICON_COLUMN_IN_THEME_UNITS = 6;
const GRID_TIMESTAMP_COLUMN_IN_THEME_UNITS = 20;

export const DialogContent = styled(MuiDialogContent)(({ theme }) => ({
  display: 'grid',
  gridTemplateRows: 'repeat(auto-fill, 1fr)',
  rowGap: theme.spacing(1),
}));

export const GridLogDisplay = styled(LogDisplay)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: `${theme.spacing(GRID_ICON_COLUMN_IN_THEME_UNITS)} ${theme.spacing(GRID_TIMESTAMP_COLUMN_IN_THEME_UNITS)} 1fr`,
  columnGap: theme.spacing(2),
}));
