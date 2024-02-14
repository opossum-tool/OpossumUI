// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiInputBase from '@mui/material/InputBase';

export const Input = styled(MuiInputBase)({
  background: 'white',
  padding: '8px 16px',
  '& input[type=search]::-webkit-search-cancel-button': { display: 'none' },
  '& .MuiInputBase-input': {
    padding: 0,
  },
});
