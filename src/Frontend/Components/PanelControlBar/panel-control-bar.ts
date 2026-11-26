// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiPaper from '@mui/material/Paper';

import { OpossumColors } from '../../shared-styles';

export const PanelControlBar = styled(MuiPaper)({
  backgroundColor: OpossumColors.lightBlue,
  borderRadius: 0,
  position: 'relative',
  zIndex: 2,
});
