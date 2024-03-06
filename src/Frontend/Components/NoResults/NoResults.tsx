// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { text } from '../../../shared/text';

export const NoResults = styled((props) => (
  <MuiBox {...props}>
    <MuiTypography sx={{ textTransform: 'uppercase' }}>
      {text.generic.noResults}
    </MuiTypography>
  </MuiBox>
))({
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 0.5,
});
