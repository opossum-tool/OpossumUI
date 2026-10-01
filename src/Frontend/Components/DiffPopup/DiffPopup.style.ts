// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Theme } from '@mui/material/styles';

import { borderThin, OpossumColors, Sizing } from '../../shared-styles';

const comparisonGrid = {
  columnGap: Sizing.SmallGap,
  display: 'grid',
  // 8 units = 32px: middle comparison column width
  gridTemplateColumns: ({ spacing }: Theme) =>
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    `minmax(0, 1fr) ${spacing(8)} minmax(0, 1fr)`,
  minWidth: 0,
} as const;

export const diffPopupStyles = {
  content: {
    background: OpossumColors.almostWhiteBlue,
    py: Sizing.SmallGap,
    px: Sizing.MediumPad,
  },
  comparison: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizing.MediumPad,
    minWidth: 0,
  },
  comparisonHeader: {
    ...comparisonGrid,
    alignItems: 'center',
    background: OpossumColors.almostWhiteBlue,
    py: Sizing.SmallGap,
    px: 0,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  comparisonHeaderLabel: {
    color: OpossumColors.darkBlue,
    fontWeight: 700,
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  auditingComparison: {
    ...comparisonGrid,
    alignItems: 'start',
    mb: Sizing.MediumPad,
    minWidth: 0,
  },
  auditingColumn: {
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
  },
  auditingOptions: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizing.MediumPad,
    minWidth: 0,
  },
  sectionHeader: {
    alignItems: 'center',
    display: 'flex',
    gap: Sizing.SmallGap,
    padding: 0,
  },
  sectionTitle: {
    color: OpossumColors.darkBlue,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  comparisonRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizing.MediumPad,
    minWidth: 0,
  },
  comparisonRow: {
    ...comparisonGrid,
    alignItems: 'start',
  },
  comparisonCell: {
    minWidth: 0,
  },
  comparisonActionCell: {
    alignItems: 'center',
    alignSelf: 'stretch',
    display: 'flex',
    justifyContent: 'center',
    minWidth: 0,
    position: 'relative',
  },
  differenceField: {
    '& .MuiOutlinedInput-root:not(.Mui-focused)': {
      backgroundColor: OpossumColors.lightestBlue,
    },
    '& label[data-shrink=true]': {
      backgroundColor: OpossumColors.lightestBlue,
    },
  },
  independentColumns: {
    ...comparisonGrid,
    alignItems: 'start',
  },
  independentColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizing.MediumPad,
    minWidth: 0,
  },
  transferControls: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  transferButton: {
    borderRadius: ({ shape }: Theme) => shape.borderRadiusSmall,
    color: OpossumColors.mediumGrey,
    height: ({ spacing }: Theme) => spacing(Sizing.Row),
    padding: 0,
    width: ({ spacing }: Theme) => spacing(Sizing.Section),
    '&:hover': {
      background: OpossumColors.lightestBlue,
      color: OpossumColors.darkBlue,
    },
  },
  helper: {
    color: OpossumColors.mediumGrey,
    display: 'block',
    mt: 0.25,
  },
  attributionTypeField: {
    minWidth: 0,
    position: 'relative',
  },
  attributionTypeUndo: {
    backgroundColor: OpossumColors.almostWhiteBlue,
    border: `${borderThin} solid ${OpossumColors.lightBlue}`,
    borderRadius: '50%',
    height: ({ spacing }: Theme) => spacing(Sizing.Section),
    left: '50%',
    padding: 0,
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: ({ spacing }: Theme) => spacing(Sizing.Section),
    zIndex: 1,
    '&:hover': {
      backgroundColor: OpossumColors.lightestBlue,
    },
  },
} as const;
