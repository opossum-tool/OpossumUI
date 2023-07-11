// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SxProps } from '@mui/material';
import { ChangeEvent } from 'react';
import { OpossumColors } from '../../shared-styles';

export const inputElementClasses = {
  textFieldBoldText: {
    '& input': {
      fontWeight: 'bold',
    },
  },
  textField: {
    width: '100%',
    '& div': {
      backgroundColor: OpossumColors.white,
      borderRadius: '0px',
    },
    '& label': {
      backgroundColor: OpossumColors.white,
      padding: '1px 3px',
      fontSize: '13px',
    },
    '& span': {
      padding: '0px',
    },
    '& legend': {
      marginLeft: '6px',
      '& span': {
        paddingLeft: '0px',
        paddingRight: '0px',
      },
    },
  },
  defaultHighlightedTextField: {
    '& div': {
      backgroundColor: OpossumColors.lightOrange,
      borderRadius: '0px',
    },
    '& label': {
      backgroundColor: OpossumColors.lightOrange,
      padding: '1px 3px',
    },
  },
  strongHighlightedTextField: {
    '& div': {
      backgroundColor: OpossumColors.darkOrange,
      borderRadius: '0px',
    },
    '& label': {
      backgroundColor: OpossumColors.darkOrange,
      padding: '1px 3px',
    },
  },
  popper: {
    '& popper': {
      '& div': {
        fontWeight: 'bold',
      },
    },
  },
};

export interface InputElementProps {
  title?: string;
  isEditable?: boolean;
  text?: string;
  sx?: SxProps;
  handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void;
  isHighlighted?: boolean;
}
