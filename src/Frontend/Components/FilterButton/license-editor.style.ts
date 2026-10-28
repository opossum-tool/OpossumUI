// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

import { OpossumColors, Sizing } from '../../shared-styles';

export const styles = {
  editor: {
    width: '420px',
    height: '480px',
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  tabs: {
    flex: 1,
    minWidth: 0,
    minHeight: '38px',
    '& .MuiTab-root': {
      minHeight: '38px',
      minWidth: 0,
      px: Sizing.MediumPad,
      py: 1,
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
    py: 1,
    pl: Sizing.MediumPad,
    // 4.25 units = 17px, matching the other filter rows.
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    pr: ({ spacing }) => spacing(4.25),
    minHeight: '38px',
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
