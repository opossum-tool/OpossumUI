// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { alpha, type SxProps, type Theme } from '@mui/material/styles';

import { OpossumColors, TRANSITION } from '../../shared-styles';

export const resourceBrowserFilterButtonStyle = (
  isFilterActive: boolean,
): SxProps<Theme> => ({
  padding: '2px',
  color: isFilterActive ? OpossumColors.white : OpossumColors.lightBlue,
  '&:hover': {
    backgroundColor: alpha(OpossumColors.white, 0.15),
  },
  transition: TRANSITION,
});
