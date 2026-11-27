// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

export const aiReviewBodyClasses = {
  card: { flexShrink: 0, minWidth: 0, overflow: 'hidden' },
  cardHeader: { p: 2, borderBottom: 1, borderColor: 'divider' },
  table: {
    tableLayout: 'fixed',
    '& tbody tr:last-child > td': { borderBottom: 0 },
  },
  headCell: { typography: 'caption', color: 'text.secondary' },
  chevronCell: { p: 0 },
  fieldCell: { fontWeight: 'bold', overflowWrap: 'anywhere' },
  summaryValue: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyValue: { color: 'text.disabled' },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    gap: 2,
    alignItems: 'start',
  },
  detailLabel: { typography: 'overline', color: 'text.secondary' },
  detailValue: {
    typography: 'body2',
    minWidth: 0,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  },
} satisfies Record<string, SxProps<Theme>>;
