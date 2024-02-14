// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material';

export const ClearButton = styled(ClearIcon)({
  padding: '2px',
  borderRadius: '50%',
  cursor: 'pointer',
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.04)',
  },
});
