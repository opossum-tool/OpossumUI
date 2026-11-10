// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { styled } from '@mui/material/styles';

import {
  borderMedium,
  borderThin,
  OpossumColors,
  Sizing,
} from '../../shared-styles';

const SCREENSHOT_PREVIEW_HEIGHT_RATIO = 1 / 2;

export const ScreenshotFigure = styled('figure')(({ theme }) => ({
  margin: 0,
  width: 'fit-content',
  maxWidth: '100%',
  boxSizing: 'border-box',
  padding: theme.spacing(Sizing.MediumPad),
  backgroundColor: OpossumColors.lightestGrey,
  border: `${borderThin} solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadiusMedium,
  '& img': {
    display: 'block',
    width: 'auto',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: `${SCREENSHOT_PREVIEW_HEIGHT_RATIO * 100}vh`,
    marginInline: 'auto',
  },
  '& figcaption': {
    ...theme.typography.caption,
    marginTop: theme.spacing(Sizing.SmallGap),
    color: theme.palette.text.secondary,
  },
}));

export const ScreenshotOpenButton = styled('button')(({ theme }) => ({
  display: 'block',
  width: 'fit-content',
  maxWidth: '100%',
  marginInline: 'auto',
  padding: 0,
  border: 0,
  background: 'none',
  cursor: 'zoom-in',
  '&:focus-visible': {
    outline: `${borderMedium} solid ${theme.palette.primary.main}`,
    outlineOffset: theme.spacing(Sizing.Tiny),
  },
}));

export const ScreenshotViewerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(Sizing.MediumPad),
}));

export const ScreenshotViewerTitle = styled(MuiDialogTitle)({
  flex: '1 1 auto',
  minWidth: 0,
});

export const ScreenshotViewerContent = styled(MuiDialogContent)(
  ({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    minHeight: 0,
    padding: theme.spacing(Sizing.Section),
    backgroundColor: OpossumColors.darkGrey,
  }),
);

export const FullSizeScreenshot = styled('img')({
  display: 'block',
  flexShrink: 0,
  width: 'auto',
  height: 'auto',
  maxWidth: 'none',
  maxHeight: 'none',
  margin: 'auto',
});
