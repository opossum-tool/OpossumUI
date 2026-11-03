// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

import { OpossumColors, Sizing } from '../../shared-styles';

const EDITOR_WIDTH = '420px';

export const styles = {
  editor: ({ spacing }) => ({
    width: EDITOR_WIDTH,
    maxWidth: `calc(100vw - ${spacing(2 * Sizing.Large)})`,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  }),
  header: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  tabs: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    '& .MuiTab-root': {
      minHeight: 0,
      minWidth: 0,
      px: Sizing.MediumPad,
      py: Sizing.SmallGap,
      textTransform: 'none',
      typography: 'body2',
    },
  },
  clearButton: {
    textTransform: 'none',
    typography: 'body2',
    minWidth: 0,
    mx: Sizing.SmallGap,
  },
  row: {
    py: Sizing.SmallGap,
    pl: Sizing.MediumPad,
    pr: Sizing.Large,
    boxSizing: 'border-box',
    typography: 'body2',
    '&:hover': { bgcolor: OpossumColors.lightestBlueOnHover },
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    overflowWrap: 'anywhere',
    outlineOffset: '-1px',
  },
  label: { minWidth: 0, flex: 1 },
  removeButton: { p: 0, flexShrink: 0 },
} satisfies Record<string, SxProps<Theme>>;
