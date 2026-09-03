// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { OpossumColors } from '../../shared-styles';

const comparisonGrid = {
  columnGap: '8px',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 32px minmax(0, 1fr)',
  minWidth: 0,
} as const;

export const diffPopupStyles = {
  content: {
    background: OpossumColors.almostWhiteBlue,
    padding: '8px 12px 8px',
  },
  comparison: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: 0,
  },
  comparisonHeader: {
    ...comparisonGrid,
    alignItems: 'center',
    background: OpossumColors.almostWhiteBlue,
    padding: '8px 0',
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
    marginBottom: '12px',
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
    gap: '12px',
    minWidth: 0,
  },
  sectionHeader: {
    alignItems: 'center',
    display: 'flex',
    gap: '8px',
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
    gap: '12px',
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
    gap: '12px',
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
    borderRadius: '3px',
    color: OpossumColors.mediumGrey,
    height: '20px',
    padding: 0,
    width: '24px',
    '&:hover': {
      background: OpossumColors.lightestBlue,
      color: OpossumColors.darkBlue,
    },
  },
  helper: {
    color: OpossumColors.mediumGrey,
    display: 'block',
    marginTop: '1px',
  },
  attributionTypeField: {
    minWidth: 0,
    position: 'relative',
  },
  attributionTypeUndo: {
    backgroundColor: OpossumColors.almostWhiteBlue,
    border: `1px solid ${OpossumColors.lightBlue}`,
    borderRadius: '50%',
    height: 24,
    left: '50%',
    padding: 0,
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 24,
    zIndex: 1,
    '&:hover': {
      backgroundColor: OpossumColors.lightestBlue,
    },
  },
} as const;
