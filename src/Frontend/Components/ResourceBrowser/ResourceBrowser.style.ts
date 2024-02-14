// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/system/Box';

import { SearchTextField } from '../SearchTextField/SearchTextField';

export const SearchInput = styled(SearchTextField)({
  zIndex: 2,
  position: 'relative',
  boxShadow:
    '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
});

export const Panel = styled(MuiBox)({
  flex: 1,
  overflowY: 'auto',
});
