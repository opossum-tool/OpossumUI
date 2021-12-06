// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement } from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import { PackageInfo } from '../../../shared/shared-types';
import { TextBox } from '../InputElements/TextBox';
import { useAttributionColumnStyles } from './shared-attribution-column-styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IconButton } from '../IconButton/IconButton';
import { makeStyles } from '@mui/styles';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import { FetchLicenseInformationButton } from '../FetchLicenseInformationButton/FetchLicenseInformationButton';

const useStyles = makeStyles({ clickableIcon, disabledIcon });

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
  const iconClasses = useStyles();

  function openUrl(): void {
    let urlString = props.displayPackageInfo.url;
    if (urlString) {
      if (
        !urlString.startsWith('https://') &&
        !urlString.startsWith('http://')
      ) {
        urlString = 'https://' + urlString;
      }
      window.ipcRenderer.invoke(IpcChannel.OpenLink, {
        link: urlString,
      });
    }
  }

  return (
    <MuiPaper className={classes.panel} elevation={0} square={true}>
      <div className={classes.displayRow}>
        <TextBox
          className={clsx(classes.textBox)}
          title={'Name'}
          text={props.displayPackageInfo.packageName}
          handleChange={props.setUpdateTemporaryPackageInfoFor('packageName')}
          isEditable={props.nameAndVersionAreEditable}
        />
        <TextBox
          className={clsx(classes.textBox, classes.rightTextBox)}
          title={'Version'}
          text={props.displayPackageInfo.packageVersion}
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
        handleChange={props.handlePurlChange}
        isEditable={props.isEditable}
      />
      <TextBox
        isEditable={props.isEditable}
        className={clsx(classes.textBox)}
        title={'URL'}
        text={props.displayPackageInfo.url}
        handleChange={props.setUpdateTemporaryPackageInfoFor('url')}
        endIcon={
          <>
            <FetchLicenseInformationButton
              url={props.displayPackageInfo.url}
              isDisabled={!props.isEditable}
            />
            <IconButton
              tooltipTitle="open link in browser"
              placement="right"
              onClick={openUrl}
              disabled={!props.displayPackageInfo.url}
              icon={
                <OpenInNewIcon
                  aria-label={'Url icon'}
                  className={
                    props.displayPackageInfo.url
                      ? iconClasses.clickableIcon
                      : iconClasses.disabledIcon
                  }
                />
              }
            />
          </>
        }
      />
    </MuiPaper>
  );
}
