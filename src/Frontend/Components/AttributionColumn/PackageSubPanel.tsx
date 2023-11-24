// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MuiBox from '@mui/material/Box';
import MuiPaper from '@mui/material/Paper';
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { HighlightingColor } from '../../enums/enums';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import {
  isImportantAttributionInformationMissing,
  isNamespaceRequiredButMissing,
} from '../../util/is-important-attribution-information-missing';
import { openUrl } from '../../util/open-url';
import { usePackageInfoChangeHandler } from '../../util/use-package-info-change-handler';
import { FetchLicenseInformationButton } from '../FetchLicenseInformationButton/FetchLicenseInformationButton';
import { IconButton } from '../IconButton/IconButton';
import { SearchPackagesIcon } from '../Icons/Icons';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';

const classes = {
  displayRow: {
    display: 'flex',
    gap: '8px',
  },
};

interface PackageSubPanelProps {
  displayPackageInfo: DisplayPackageInfo;
  arePurlElementsEditable: boolean;
  isDisplayedPurlValid: boolean;
  isEditable: boolean;
  temporaryPurl: string;
  handlePurlChange(event: React.ChangeEvent<{ value: string }>): void;
  openPackageSearchPopup(): void;
  showHighlight?: boolean;
}

export function PackageSubPanel(props: PackageSubPanelProps): ReactElement {
  const handleChange = usePackageInfoChangeHandler();

  return (
    <MuiPaper sx={attributionColumnClasses.panel} elevation={0} square={true}>
      <MuiBox sx={classes.displayRow}>
        {renderPackageType()}
        {renderPackageNamespace()}
      </MuiBox>
      <MuiBox sx={classes.displayRow}>
        {renderPackageName()}
        {renderPackageVersion()}
      </MuiBox>
      {renderPurl()}
      {renderRepositoryUrl()}
    </MuiPaper>
  );

  function renderPackageType(): React.ReactElement {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.packageType}
        text={props.displayPackageInfo.packageType}
        handleChange={handleChange('packageType')}
        isEditable={props.arePurlElementsEditable}
        isHighlighted={
          props.showHighlight &&
          isImportantAttributionInformationMissing(
            'packageType',
            props.displayPackageInfo,
          )
        }
        highlightingColor={HighlightingColor.DarkOrange}
      />
    );
  }

  function renderPackageNamespace(): React.ReactElement {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        error={isNamespaceRequiredButMissing(
          props.displayPackageInfo.packageType,
          props.displayPackageInfo.packageNamespace,
        )}
        title={text.attributionColumn.packageSubPanel.packageNamespace}
        text={props.displayPackageInfo.packageNamespace}
        handleChange={handleChange('packageNamespace')}
        isEditable={props.arePurlElementsEditable}
        isHighlighted={
          props.showHighlight &&
          isImportantAttributionInformationMissing(
            'packageNamespace',
            props.displayPackageInfo,
          )
        }
        highlightingColor={HighlightingColor.DarkOrange}
      />
    );
  }

  function renderPackageName(): React.ReactElement {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.packageName}
        text={props.displayPackageInfo.packageName}
        handleChange={handleChange('packageName')}
        isEditable={props.arePurlElementsEditable}
        endIcon={
          <IconButton
            tooltipTitle={
              text.attributionColumn.packageSubPanel.searchForPackage
            }
            tooltipPlacement="right"
            onClick={props.openPackageSearchPopup}
            disabled={!props.isEditable}
            icon={
              <SearchPackagesIcon
                sx={props.isEditable ? clickableIcon : disabledIcon}
              />
            }
          />
        }
        isHighlighted={
          props.showHighlight &&
          isImportantAttributionInformationMissing(
            'packageName',
            props.displayPackageInfo,
          )
        }
        highlightingColor={HighlightingColor.DarkOrange}
      />
    );
  }

  function renderPackageVersion(): React.ReactElement {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.packageVersion}
        text={props.displayPackageInfo.packageVersion}
        handleChange={handleChange('packageVersion')}
        isEditable={props.arePurlElementsEditable}
        isHighlighted={
          props.showHighlight &&
          isImportantAttributionInformationMissing(
            'packageVersion',
            props.displayPackageInfo,
          )
        }
      />
    );
  }

  function renderPurl(): React.ReactElement {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        error={!props.isDisplayedPurlValid}
        title={text.attributionColumn.packageSubPanel.purl}
        text={props.temporaryPurl}
        handleChange={props.handlePurlChange}
        isEditable={props.isEditable}
        isHighlighted={
          props.showHighlight &&
          isImportantAttributionInformationMissing(
            'packageNamespace',
            props.displayPackageInfo,
          )
        }
      />
    );
  }

  function renderRepositoryUrl(): React.ReactElement {
    const openLinkButtonTooltip = props.displayPackageInfo.url
      ? text.attributionColumn.packageSubPanel.openLinkInBrowser
      : text.attributionColumn.packageSubPanel.noLinkToOpen;

    return (
      <TextBox
        isEditable={props.isEditable}
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.repositoryUrl}
        text={props.displayPackageInfo.url}
        handleChange={handleChange('url')}
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
                    props.displayPackageInfo.url ? clickableIcon : disabledIcon
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
            props.displayPackageInfo,
          )
        }
      />
    );
  }
}
