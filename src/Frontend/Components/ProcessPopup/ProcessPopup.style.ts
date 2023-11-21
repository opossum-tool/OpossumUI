// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Typography } from '@mui/material';
import { styled } from '@mui/system';

export const MessageContainer = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  paddingBottom: '4px',
});

export const MetaContainer = styled('div')({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
});

export const BreakableTypography = styled(Typography)({
  wordBreak: 'break-all',
});
