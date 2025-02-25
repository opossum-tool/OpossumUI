// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/system';

import { LogDisplay } from '../LogDisplay/LogDisplay';

export const DialogLogDisplay = styled(LogDisplay)({
  display: 'flex',
  alignItems: 'center',
  columnGap: '4px',
  flexGrow: 1,
  flexBasis: 0,
  minWidth: 0,
});
