// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

export const editorClasses = {
  trigger: {
    width: '100%',
    justifyContent: 'flex-start',
    gap: 1,
    borderRadius: 1,
    font: 'inherit',
    textAlign: 'left',
    '&:hover, &.Mui-focusVisible': { backgroundColor: 'action.hover' },
    '&:hover > svg, &.Mui-focusVisible > svg': { opacity: 1 },
  },
  value: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  multiline: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  editIcon: { flexShrink: 0, color: 'text.secondary', opacity: 0 },
  panel: { width: 'min(60ch, 90vw)', p: 2 },
} satisfies Record<string, SxProps<Theme>>;
