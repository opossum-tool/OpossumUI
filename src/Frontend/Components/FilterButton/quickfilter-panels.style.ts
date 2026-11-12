// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

import {
  borderThin,
  checkIconSize,
  OpossumColors,
  Sizing,
  TRANSITION,
} from '../../shared-styles';

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
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies SxProps<Theme>,
  titleActions: {
    display: 'flex',
    alignItems: 'center',
    gap: Sizing.SmallGap,
  } satisfies SxProps<Theme>,
  // Mirrors the clear button of the license editor header.
  clearButton: {
    textTransform: 'none',
    typography: 'body2',
    minWidth: 0,
    flexShrink: 0,
  } satisfies SxProps<Theme>,
  titleButton: { p: Sizing.Tiny, flexShrink: 0 } satisfies SxProps<Theme>,
  list: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    minHeight: 0,
    // Rows sit directly on top of each other like the filter menu items; a
    // thin divider separates them so selected rows form a continuous block.
    '& > :not(:last-child)': {
      borderBottom: `${borderThin} solid`,
      borderColor: 'divider',
    },
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
  // Matches the selected state of the normal filter menu items.
  selectedRow: {
    bgcolor: OpossumColors.lightestBlue,
    '&:hover': { bgcolor: OpossumColors.lightestBlue },
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
  checkIcon: {
    width: checkIconSize,
    height: checkIconSize,
    flexShrink: 0,
  } satisfies SxProps<Theme>,
  hiddenIcon: {
    visibility: 'hidden',
  } satisfies SxProps<Theme>,
  editRow: {
    display: 'flex',
    alignItems: 'center',
    gap: Sizing.SmallGap,
    px: Sizing.MediumPad,
    py: Sizing.SmallGap,
    typography: 'body2',
    userSelect: 'none',
    '&:hover': { bgcolor: OpossumColors.lightestBlue },
  } satisfies SxProps<Theme>,
  // Other rows glide aside while the dragged row follows the pointer.
  smoothRow: {
    transition: TRANSITION,
  } satisfies SxProps<Theme>,
  shiftedRow: {
    '&:hover': { bgcolor: 'transparent' },
  } satisfies SxProps<Theme>,
  // Lifted look while the row is being held.
  draggingRow: {
    bgcolor: OpossumColors.white,
    boxShadow: `0 4px 12px ${OpossumColors.disabledGrey}`,
    zIndex: 1,
    '&:hover': { bgcolor: OpossumColors.white },
  } satisfies SxProps<Theme>,
  dragHandle: {
    display: 'flex',
    flexShrink: 0,
    cursor: 'grab',
    touchAction: 'none',
    color: OpossumColors.mediumGrey,
    '&:hover': { color: OpossumColors.darkGrey },
    '&:focus-visible': {
      outline: `${borderThin} solid ${OpossumColors.darkBlue}`,
    },
  } satisfies SxProps<Theme>,
  dragHandleActive: {
    cursor: 'grabbing',
  } satisfies SxProps<Theme>,
  dragHandleIcon: {
    // Same slot size as the bookmark icon in the apply view so the rows keep
    // their height and the label keeps its width when toggling the edit view.
    fontSize: checkIconSize,
  } satisfies SxProps<Theme>,
  editButton: {
    // Sized to the icon slot so rows stay as compact as in the apply view.
    p: 0,
    width: checkIconSize,
    height: checkIconSize,
    flexShrink: 0,
  } satisfies SxProps<Theme>,
  renameInput: {
    flex: 1,
    minWidth: 0,
  } satisfies SxProps<Theme>,
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
