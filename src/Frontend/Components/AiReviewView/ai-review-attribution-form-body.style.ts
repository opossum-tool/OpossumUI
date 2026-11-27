// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { borderThin, OpossumColors, Sizing } from '../../shared-styles';

const themeSpacing = (size: Sizing) => (theme: Theme) => theme.spacing(size);
const EXPANDED_ROW_INSET = Sizing.Section + Sizing.MediumPad;

export const aiReviewBodyClasses = {
  bodyStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: themeSpacing(Sizing.MediumPad),
    minWidth: 0,
  },
  card: {
    backgroundColor: OpossumColors.white,
    border: `${borderThin} solid`,
    borderColor: OpossumColors.lightBlue,
    borderRadius: ({ shape }: Theme) => shape.borderRadiusMedium,
    flex: 'none',
    minWidth: 0,
    overflow: 'hidden',
  },
  cardHeader: (theme) => ({
    ...theme.typography.subtitle2,
    borderBottom: `${borderThin} solid`,
    borderColor: OpossumColors.lightBlue,
    fontWeight: theme.typography.fontWeightBold,
    py: themeSpacing(Sizing.SmallGap),
    px: themeSpacing(Sizing.MediumPad),
  }),
  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    tableLayout: 'fixed',
    width: '100%',
    '& tbody tr:last-child > td': { borderBottom: 0 },
    '& tbody tr.MuiTableRow-hover:hover': {
      backgroundColor: OpossumColors.almostWhiteBlue,
    },
  },
  headCell: (theme) => ({
    ...theme.typography.caption,
    backgroundColor: OpossumColors.almostWhiteBlue,
    borderBottom: `${borderThin} solid`,
    borderColor: theme.palette.divider,
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightBold,
    px: themeSpacing(Sizing.MediumPad),
    py: themeSpacing(Sizing.Tiny),
    textAlign: 'left',
    whiteSpace: 'nowrap',
  }),
  summaryRow: {
    cursor: 'pointer',
    '& > td': { borderBottom: `${borderThin} solid`, borderColor: 'divider' },
  },
  expandedSummary: {
    backgroundColor: OpossumColors.lightestBlue,
    '& > td': { borderBottom: 0 },
  },
  summaryCell: {
    borderBottom: `${borderThin} solid`,
    borderColor: 'divider',
    px: themeSpacing(Sizing.MediumPad),
    py: themeSpacing(Sizing.SmallGap),
    verticalAlign: 'middle',
  },
  chevronCell: {
    borderBottom: `${borderThin} solid`,
    borderColor: 'divider',
    p: themeSpacing(Sizing.Tiny),
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  stateCell: {
    borderBottom: `${borderThin} solid`,
    borderColor: 'divider',
    color: 'text.secondary',
    px: themeSpacing(Sizing.SmallGap),
    py: themeSpacing(Sizing.SmallGap),
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },
  fieldCell: (theme) => ({
    ...theme.typography.body2,
    borderBottom: `${borderThin} solid`,
    borderColor: 'divider',
    fontWeight: theme.typography.fontWeightBold,
    overflowWrap: 'anywhere',
    px: themeSpacing(Sizing.SmallGap),
    py: themeSpacing(Sizing.SmallGap),
    verticalAlign: 'middle',
  }),
  summaryValue: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyValue: {
    color: 'text.disabled',
    fontStyle: 'italic',
  },
  button: {
    color: 'text.secondary',
    '&:hover': { backgroundColor: OpossumColors.lightestBlue },
    '&.Mui-focusVisible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: (theme: Theme) => theme.spacing(-Sizing.Tiny),
    },
  },
  expandedRow: {
    backgroundColor: OpossumColors.white,
    '& > td': { borderBottom: `${borderThin} solid`, borderColor: 'divider' },
  },
  expandedCell: {
    backgroundColor: OpossumColors.white,
    pl: themeSpacing(EXPANDED_ROW_INSET),
    pr: themeSpacing(Sizing.MediumPad),
    py: themeSpacing(Sizing.SmallGap),
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: (theme: Theme) =>
      `${theme.spacing(Sizing.WideButton)} minmax(0, 1fr)`,
    columnGap: themeSpacing(Sizing.MediumPad),
    rowGap: themeSpacing(Sizing.SmallGap),
    alignItems: 'start',
  },
  detailLabel: (theme) => ({
    ...theme.typography.overline,
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightBold,
    pt: themeSpacing(Sizing.Tiny),
  }),
  detailValue: (theme) => ({
    ...theme.typography.body2,
    minWidth: 0,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  }),
  emptyDetailValue: (theme) => ({
    ...theme.typography.body2,
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
    minWidth: 0,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  }),
  comment: {
    px: themeSpacing(Sizing.MediumPad),
    py: themeSpacing(Sizing.SmallGap),
  },
  commentValue: (theme) => ({
    ...theme.typography.body2,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  }),
  commentEmptyValue: (theme) => ({
    ...theme.typography.body2,
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  }),
} satisfies Record<string, SxProps<Theme>>;
