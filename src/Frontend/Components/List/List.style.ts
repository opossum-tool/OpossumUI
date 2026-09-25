// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiLinearProgress from '@mui/material/LinearProgress';

export const StyledLinearProgress = styled(MuiLinearProgress)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 0.5 theme spacing units (= 2px)
  height: theme.spacing(0.5),
  zIndex: 2,
  top: 0,
  left: 0,
}));
