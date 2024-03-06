// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import Paper from '@mui/material/Paper';

import { OpossumColors } from '../../shared-styles';

export const Container = styled(Paper)({
  display: 'flex',
  background: OpossumColors.lightestBlue,
  zIndex: 3,
});
