// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MuiBox from '@mui/material/Box';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { HighlightingColor, PopupType } from '../../enums/enums';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { generatePurl, parsePurl } from '../../util/handle-purl';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
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
  isEditable: boolean;
  showHighlight?: boolean;
}

export function PackageSubPanel(props: PackageSubPanelProps) {
  const dispatch = useAppDispatch();
  const handleChange = usePackageInfoChangeHandler();

  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      <MuiBox sx={classes.displayRow}>
        {renderPackageName()}
        {renderPackageNamespace()}
      </MuiBox>
      <MuiBox sx={classes.displayRow}>
        {renderPackageVersion()}
        {renderPackageType()}
      </MuiBox>
      {renderPurl()}
      {renderRepositoryUrl()}
    </MuiBox>
  );

  function renderPackageType() {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.packageType}
        text={props.displayPackageInfo.packageType}
        handleChange={handleChange('packageType')}
        isEditable={props.isEditable}
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

  function renderPackageNamespace() {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.packageNamespace}
        text={props.displayPackageInfo.packageNamespace}
        handleChange={handleChange('packageNamespace')}
        isEditable={props.isEditable}
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

  function renderPackageName() {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.packageName}
        text={props.displayPackageInfo.packageName}
        handleChange={handleChange('packageName')}
        isEditable={props.isEditable}
        endIcon={
          <IconButton
            tooltipTitle={
              text.attributionColumn.packageSubPanel.searchForPackage
            }
            tooltipPlacement="right"
            onClick={() => dispatch(openPopup(PopupType.PackageSearchPopup))}
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

  function renderPackageVersion() {
    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.packageVersion}
        text={props.displayPackageInfo.packageVersion}
        handleChange={handleChange('packageVersion')}
        isEditable={props.isEditable}
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
    const purl = generatePurl(props.displayPackageInfo);
    const pasteFromClipboard = async () => {
      const parsedPurl = parsePurl(await navigator.clipboard.readText());
      if (parsedPurl) {
        dispatch(
          setTemporaryDisplayPackageInfo({
            ...props.displayPackageInfo,
            packageName: parsedPurl.name,
            packageVersion: parsedPurl.version ?? undefined,
            packageType: parsedPurl.type,
            packageNamespace: parsedPurl.namespace ?? undefined,
          }),
        );
      }
    };

    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.purl}
        text={purl}
        isEditable={false}
        endIcon={
          <>
            {!!purl && (
              <IconButton
                tooltipTitle={
                  text.attributionColumn.packageSubPanel.copyToClipboard
                }
                tooltipPlacement="left"
                onClick={() => navigator.clipboard.writeText(purl)}
                icon={<ContentCopyIcon sx={clickableIcon} />}
                aria-label={
                  text.attributionColumn.packageSubPanel.copyToClipboard
                }
              />
            )}
            {props.isEditable && (
              <IconButton
                tooltipTitle={
                  text.attributionColumn.packageSubPanel.pasteFromClipboard
                }
                tooltipPlacement="left"
                onClick={pasteFromClipboard}
                icon={<ContentPasteIcon sx={clickableIcon} />}
                aria-label={
                  text.attributionColumn.packageSubPanel.pasteFromClipboard
                }
              />
            )}
          </>
        }
      />
    );
  }

  function renderRepositoryUrl(): React.ReactElement {
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
            {!!props.displayPackageInfo.url && (
              <IconButton
                tooltipTitle={
                  text.attributionColumn.packageSubPanel.openLinkInBrowser
                }
                tooltipPlacement="right"
                onClick={(): void => {
                  props.displayPackageInfo.url &&
                    openUrl(props.displayPackageInfo.url);
                }}
                icon={
                  <OpenInNewIcon aria-label={'Url icon'} sx={clickableIcon} />
                }
              />
            )}
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
