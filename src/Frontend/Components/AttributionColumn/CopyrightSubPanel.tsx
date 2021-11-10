// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement } from 'react';
import { PackageInfo } from '../../../shared/shared-types';
import { TextBox } from '../InputElements/TextBox';
import { useAttributionColumnStyles } from './shared-attribution-column-styles';

interface CopyrightSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: PackageInfo;
  setUpdateTemporaryPackageInfoFor(
    propertyToUpdate: string
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  copyrightRows: number;
}

export function CopyrightSubPanel(props: CopyrightSubPanelProps): ReactElement {
  const classes = useAttributionColumnStyles();

  return (
    <MuiPaper className={classes.panel} elevation={0} square={true}>
      <div className={classes.displayRow}>
        <TextBox
          isEditable={props.isEditable}
          className={clsx(classes.textBox)}
          title={'Copyright'}
          text={props.displayPackageInfo.copyright}
          minRows={props.copyrightRows}
          maxRows={props.copyrightRows}
          multiline={true}
          handleChange={props.setUpdateTemporaryPackageInfoFor('copyright')}
        />
      </div>
    </MuiPaper>
  );
}
