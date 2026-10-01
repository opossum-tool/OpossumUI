// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { alpha, type SxProps, type Theme } from '@mui/material/styles';

import { OpossumColors, TRANSITION } from '../../shared-styles';

export const resourceBrowserFilterButtonStyle = (
  isFilterActive: boolean,
): SxProps<Theme> => ({
  p: 0.5,
  color: isFilterActive ? OpossumColors.white : OpossumColors.lightBlue,
  '&:hover': {
    // 0.15: translucent white overlay
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    backgroundColor: alpha(OpossumColors.white, 0.15),
  },
  transition: TRANSITION,
});
