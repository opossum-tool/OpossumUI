// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialogContent from '@mui/material/DialogContent';
import { styled } from '@mui/system';

export const DialogContent = styled(MuiDialogContent)({
  display: 'grid',
  gridTemplateRows: 'repeat(auto-fill, 1fr)',
  rowGap: '4px',
});
