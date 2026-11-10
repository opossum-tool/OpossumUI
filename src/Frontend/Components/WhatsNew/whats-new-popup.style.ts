// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

import { Sizing } from '../../shared-styles';

export const releaseNotesContentSx: SxProps<Theme> = (theme) => ({
  ...theme.typography.body1,
  color: theme.palette.text.primary,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(Sizing.Section),
  overflowWrap: 'anywhere',
  '& > section': {
    display: 'flex',
    flexDirection: 'column',
    marginInline: theme.spacing(Sizing.SmallGap),
    gap: theme.spacing(Sizing.MediumPad),
  },
  '& h2': {
    ...theme.typography.subtitle1,
    fontWeight: theme.typography.fontWeightBold,
    margin: 0,
  },
  '& p': {
    margin: 0,
  },
  '& img': {
    maxWidth: '100%',
    height: 'auto',
  },
});
