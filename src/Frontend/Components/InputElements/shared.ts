// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import { ChangeEvent } from 'react';
import { OpossumColors } from '../../shared-styles';

export const useInputElementStyles = makeStyles({
  textFieldBoldText: {
    '& input': {
      fontWeight: 'bold',
    },
  },
  textField: {
    width: '100%',
    '& div': {
      backgroundColor: OpossumColors.white,
      borderRadius: 0,
    },
    '& label': {
      backgroundColor: OpossumColors.white,
      padding: '1px 3px',
      fontSize: '13px',
    },
    '& span': {
      padding: 0,
    },
    '& legend': {
      marginLeft: 6,
      '& span': {
        paddingLeft: 0,
        paddingRight: 0,
      },
    },
  },
  highlightedTextField: {
    '& div': {
      backgroundColor: OpossumColors.lightOrange,
      borderRadius: 0,
    },
    '& label': {
      backgroundColor: OpossumColors.lightOrange,
      padding: '1px 3px',
    },
  },
  popper: {
    '& div': {
      fontWeight: 'bold',
    },
  },
});

export interface InputElementProps {
  title?: string;
  isEditable?: boolean;
  text?: string;
  className?: string;
  handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void;
  isHighlighted?: boolean;
}
