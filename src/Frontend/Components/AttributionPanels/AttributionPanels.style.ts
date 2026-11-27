// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

import { OpossumColors } from '../../shared-styles';

export const attributionPanelsStyle = {
  display: 'flex',
  background: OpossumColors.lightestBlue,
  zIndex: 3,
} satisfies SxProps<Theme>;
