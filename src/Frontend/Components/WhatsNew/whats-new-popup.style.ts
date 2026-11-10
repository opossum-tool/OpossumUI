// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

export const releaseNotesContentSx = {
  overflowWrap: 'anywhere',
  '& img': {
    maxWidth: '100%',
    height: 'auto',
  },
} satisfies SxProps<Theme>;
