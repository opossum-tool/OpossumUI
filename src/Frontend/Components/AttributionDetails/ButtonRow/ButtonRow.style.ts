// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { styled } from '@mui/material';
import MuiBox from '@mui/system/Box';

export const Container = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  padding: theme.spacing(3),
}));
