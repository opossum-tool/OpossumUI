// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

import { OpossumColors, Sizing } from '../../shared-styles';

const PANEL_WIDTH = '300px';

export const styles = {
  panel: {
    width: PANEL_WIDTH,
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    p: Sizing.MediumPad,
    gap: Sizing.SmallGap,
    outline: 'none',
  } satisfies SxProps<Theme>,
  title: {
    typography: 'subtitle2',
    color: OpossumColors.darkBlue,
  } satisfies SxProps<Theme>,
  list: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    minHeight: 0,
  } satisfies SxProps<Theme>,
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: Sizing.SmallGap,
    px: Sizing.MediumPad,
    py: Sizing.SmallGap,
    typography: 'body2',
    cursor: 'pointer',
    '&:hover': { bgcolor: OpossumColors.lightestBlueOnHover },
    outlineOffset: '-1px',
  } satisfies SxProps<Theme>,
  inapplicableRow: {
    opacity: 0.5,
    cursor: 'default',
    '&:hover': { bgcolor: 'transparent' },
  } satisfies SxProps<Theme>,
  label: {
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies SxProps<Theme>,
  activeLabel: {
    fontWeight: 'bold',
  } satisfies SxProps<Theme>,
  icon: { flexShrink: 0 } satisfies SxProps<Theme>,
  deleteButton: { p: Sizing.Tiny, flexShrink: 0 } satisfies SxProps<Theme>,
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: Sizing.SmallGap,
  } satisfies SxProps<Theme>,
  actionButton: {
    textTransform: 'none',
    typography: 'body2',
    minWidth: 0,
  } satisfies SxProps<Theme>,
};
