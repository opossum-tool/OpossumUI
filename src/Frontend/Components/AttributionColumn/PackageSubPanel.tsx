// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@material-ui/core/Paper';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement } from 'react';
import { PackageInfo } from '../../../shared/shared-types';
import { TextBox } from '../InputElements/TextBox';
import { useAttributionColumnStyles } from './shared-attribution-column-styles';

interface PackageSubPanelProps {
  displayPackageInfo: PackageInfo;
  setUpdateTemporaryPackageInfoFor(
    propertyToUpdate: string
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  nameAndVersionAreEditable: boolean;
  isDisplayedPurlValid: boolean;
  isEditable: boolean;
  temporaryPurl: string;
  handlePurlChange(event: React.ChangeEvent<{ value: string }>): void;
}

export function PackageSubPanel(props: PackageSubPanelProps): ReactElement {
  const classes = useAttributionColumnStyles();

  return (
    <MuiPaper className={classes.panel} elevation={0} square={true}>
      <div className={classes.displayRow}>
        <TextBox
          className={clsx(classes.textBox)}
          title={'Name'}
          text={props.displayPackageInfo.packageName}
          maxRows={1}
          handleChange={props.setUpdateTemporaryPackageInfoFor('packageName')}
          isEditable={props.nameAndVersionAreEditable}
        />
        <TextBox
          className={clsx(classes.textBox, classes.rightTextBox)}
          title={'Version'}
          text={props.displayPackageInfo.packageVersion}
          maxRows={1}
          handleChange={props.setUpdateTemporaryPackageInfoFor(
            'packageVersion'
          )}
          isEditable={props.nameAndVersionAreEditable}
        />
      </div>
      <TextBox
        className={classes.textBox}
        textFieldClassname={clsx(
          props.isDisplayedPurlValid ? null : classes.textBoxInvalidInput
        )}
        title={'PURL'}
        text={props.temporaryPurl}
        maxRows={1}
        handleChange={props.handlePurlChange}
        isEditable={props.isEditable}
      />
      <TextBox
        isEditable={props.isEditable}
        className={clsx(classes.textBox)}
        maxRows={1}
        title={'URL'}
        text={props.displayPackageInfo.url}
        handleChange={props.setUpdateTemporaryPackageInfoFor('url')}
      />
    </MuiPaper>
  );
}
