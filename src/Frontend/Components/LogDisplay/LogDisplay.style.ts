// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Typography } from '@mui/material';
import { styled } from '@mui/system';

export const EllipsisTypography = styled(Typography)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const BreakableTypography = styled(Typography)({
  wordBreak: 'break-all',
});
