// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import { OpossumColors } from '../../shared-styles';

export const useAttributionColumnStyles = makeStyles({
  panel: {
    marginBottom: 5,
    padding: 6,
    paddingBottom: 0,
    background: OpossumColors.lightestBlue,
    border: `1px ${OpossumColors.lightestBlue} solid`,
  },
  displayRow: {
    display: 'flex',
  },
  textBox: {
    marginBottom: 6,
    flex: 1,
  },
  rightTextBox: {
    marginLeft: 8,
  },
  textBoxInvalidInput: {
    '& textarea, input': {
      color: OpossumColors.orange,
    },
  },
});
