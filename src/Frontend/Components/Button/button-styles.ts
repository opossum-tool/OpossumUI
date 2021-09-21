// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import { OpossumColors } from '../../shared-styles';

export const useButtonStyles = makeStyles({
  dark: {
    backgroundColor: OpossumColors.darkBlue,
    color: OpossumColors.lightBlue,
    '&:hover': {
      backgroundColor: OpossumColors.darkBlueOnHover,
      color: OpossumColors.black,
    },
  },
  mediumLight: {
    backgroundColor: OpossumColors.lightBlue,
    '&:hover': {
      backgroundColor: OpossumColors.lightBlueOnHover,
      color: OpossumColors.white,
    },
  },
  light: {
    backgroundColor: OpossumColors.white,
    '&:hover': {
      backgroundColor: OpossumColors.whiteOnHover,
      color: OpossumColors.white,
    },
  },
  disabledLight: {
    backgroundColor: OpossumColors.disabledButtonGrey,
  },
});
