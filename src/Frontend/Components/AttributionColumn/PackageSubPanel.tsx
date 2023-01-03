// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import React, { ChangeEvent, ReactElement } from 'react';
import { PackageInfo } from '../../../shared/shared-types';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IconButton } from '../IconButton/IconButton';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import { FetchLicenseInformationButton } from '../FetchLicenseInformationButton/FetchLicenseInformationButton';
import { SearchPackagesIcon } from '../Icons/Icons';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import MuiBox from '@mui/material/Box';
import { openUrl } from '../../util/open-url';

const iconClasses = { clickableIcon, disabledIcon };

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
  openPackageSearchPopup(): void;
  showHighlight?: boolean;
}

export function PackageSubPanel(props: PackageSubPanelProps): ReactElement {
  const openLinkButtonTooltip = props.displayPackageInfo.url
    ? 'Open link in browser'
    : 'No link to open. Please enter a URL.';

  return (
    <MuiPaper sx={attributionColumnClasses.panel} elevation={0} square={true}>
      <MuiBox sx={attributionColumnClasses.displayRow}>
        <TextBox
          sx={attributionColumnClasses.textBox}
          title={'Name'}
          text={props.displayPackageInfo.packageName}
          handleChange={props.setUpdateTemporaryPackageInfoFor('packageName')}
          isEditable={props.nameAndVersionAreEditable}
          endIcon={
            <IconButton
              tooltipTitle="Search for package information"
              tooltipPlacement="right"
              onClick={props.openPackageSearchPopup}
              disabled={!props.isEditable}
              icon={
                <SearchPackagesIcon
                  sx={
                    props.isEditable
                      ? iconClasses.clickableIcon
                      : iconClasses.disabledIcon
                  }
                />
              }
            />
          }
          isHighlighted={
            props.showHighlight &&
            isImportantAttributionInformationMissing(
              'packageName',
              props.displayPackageInfo
            )
          }
        />
        <TextBox
          sx={{
            ...attributionColumnClasses.textBox,
            ...attributionColumnClasses.rightTextBox,
          }}
          title={'Version'}
          text={props.displayPackageInfo.packageVersion}
          handleChange={props.setUpdateTemporaryPackageInfoFor(
            'packageVersion'
          )}
          isEditable={props.nameAndVersionAreEditable}
          isHighlighted={
            props.showHighlight &&
            isImportantAttributionInformationMissing(
              'packageVersion',
              props.displayPackageInfo
            )
          }
        />
      </MuiBox>
      <TextBox
        sx={attributionColumnClasses.textBox}
        textFieldSx={
          props.isDisplayedPurlValid
            ? {}
            : attributionColumnClasses.textBoxInvalidInput
        }
        title={'PURL'}
        text={props.temporaryPurl}
        handleChange={props.handlePurlChange}
        isEditable={props.isEditable}
        isHighlighted={
          props.showHighlight &&
          isImportantAttributionInformationMissing(
            'packageNamespace',
            props.displayPackageInfo
          )
        }
      />
      <TextBox
        isEditable={props.isEditable}
        sx={attributionColumnClasses.textBox}
        title={'URL'}
        text={props.displayPackageInfo.url}
        handleChange={props.setUpdateTemporaryPackageInfoFor('url')}
        endIcon={
          <>
            <FetchLicenseInformationButton
              url={props.displayPackageInfo.url}
              version={props.displayPackageInfo.packageVersion}
              disabled={!props.isEditable}
            />
            <IconButton
              tooltipTitle={openLinkButtonTooltip}
              tooltipPlacement="right"
              onClick={(): void => {
                props.displayPackageInfo.url &&
                  openUrl(props.displayPackageInfo.url);
              }}
              disabled={!props.displayPackageInfo.url}
              icon={
                <OpenInNewIcon
                  aria-label={'Url icon'}
                  sx={
                    props.displayPackageInfo.url
                      ? iconClasses.clickableIcon
                      : iconClasses.disabledIcon
                  }
                />
              }
            />
          </>
        }
        isHighlighted={
          props.showHighlight &&
          isImportantAttributionInformationMissing(
            'url',
            props.displayPackageInfo
          )
        }
      />
    </MuiPaper>
  );
}
